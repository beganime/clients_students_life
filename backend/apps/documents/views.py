from django.utils import timezone
from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import is_manager_user
from apps.applications.models import ApplicationFile
from apps.notifications.services import send_push_to_user

from .models import RequiredDocumentType, UserDocument
from .manager_sl_sync import sync_user_document_to_manager_sl
from .serializers import MyDocumentSerializer, RequiredDocumentTypeSerializer, UserDocumentUploadSerializer


def configured_review_api_keys():
    return {
        str(value).strip()
        for value in (
            getattr(settings, 'MANAGER_SL_LEADS_API_KEY', ''),
            getattr(settings, 'MANAGER_SL_API_KEY', ''),
            getattr(settings, 'STUDENTS_LIFE_API_KEY', ''),
            getattr(settings, 'LEADS_API_KEY', ''),
        )
        if str(value).strip()
    }


def document_review_push_text(status_value, document_title='', comment=''):
    document_title = str(document_title or '').strip() or 'документ'
    comment = str(comment or '').strip()
    if status_value == UserDocument.Status.APPROVED:
        return 'Документ принят', f'Ваш документ «{document_title}» проверен и принят.'
    if comment:
        return 'Документ не принят', f'Ваш документ «{document_title}» не принят. Причина: {comment}'
    return 'Документ не принят', f'Ваш документ «{document_title}» не принят. Посмотрите комментарий менеджера и загрузите исправленный файл.'


def send_document_review_push(user, status_value, document_title='', comment='', related_object_type='document', related_object_id=None):
    if not user or status_value not in {UserDocument.Status.APPROVED, UserDocument.Status.REJECTED}:
        return
    title, body = document_review_push_text(status_value, document_title=document_title, comment=comment)
    send_push_to_user(
        user=user,
        title=title,
        body=body,
        notification_type='document_review',
        related_object_type=related_object_type,
        related_object_id=related_object_id,
    )


class MyDocumentViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        return UserDocument.objects.select_related('document_type', 'user', 'reviewed_by').filter(user=self.request.user)

    def get_document_rows(self):
        types = RequiredDocumentType.objects.filter(is_active=True).select_related('service', 'country').order_by('sort_order', 'title')
        existing = {
            item.document_type_id: item
            for item in self.get_queryset().filter(document_type__in=types)
        }
        rows = []
        for document_type in types:
            document = existing.get(document_type.id)
            if not document:
                document = UserDocument(
                    user=self.request.user,
                    document_type=document_type,
                    status=UserDocument.Status.NOT_UPLOADED,
                )
            rows.append(document)
        return rows

    def list(self, request, *args, **kwargs):
        serializer = MyDocumentSerializer(self.get_document_rows(), many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'patch'], url_path='upload')
    def upload(self, request, pk=None):
        document_type = RequiredDocumentType.objects.filter(is_active=True, pk=pk).first()
        if not document_type:
            return Response({'detail': 'Document type not found.'}, status=status.HTTP_404_NOT_FOUND)

        document, _ = UserDocument.objects.get_or_create(user=request.user, document_type=document_type)
        serializer = UserDocumentUploadSerializer(document, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        sync_user_document_to_manager_sl(document, request=request)
        return Response(MyDocumentSerializer(document, context={'request': request}).data, status=status.HTTP_200_OK)


class UserDocumentReviewViewSet(viewsets.ModelViewSet):
    serializer_class = MyDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        qs = UserDocument.objects.select_related('document_type', 'user', 'reviewed_by').order_by('-updated_at')
        if is_manager_user(self.request.user):
            return qs
        return qs.filter(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        if not is_manager_user(request.user):
            return Response({'detail': 'Manager access required.'}, status=status.HTTP_403_FORBIDDEN)
        document = self.get_object()
        status_value = request.data.get('status')
        if status_value not in {UserDocument.Status.APPROVED, UserDocument.Status.REJECTED, UserDocument.Status.PENDING}:
            return Response({'status': 'Invalid document status.'}, status=status.HTTP_400_BAD_REQUEST)
        document.status = status_value
        document.admin_comment = str(request.data.get('admin_comment') or '').strip()
        document.reviewed_by = request.user
        document.reviewed_at = timezone.now()
        document.save(update_fields=['status', 'admin_comment', 'reviewed_by', 'reviewed_at', 'updated_at'])
        sync_user_document_to_manager_sl(document, request=request)
        return Response(MyDocumentSerializer(document, context={'request': request}).data)


class RequiredDocumentTypeViewSet(viewsets.ModelViewSet):
    serializer_class = RequiredDocumentTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = RequiredDocumentType.objects.select_related('service', 'country').order_by('sort_order', 'title')

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class ExternalDocumentReviewView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        expected_keys = configured_review_api_keys()
        if not expected_keys or request.headers.get('X-API-KEY') not in expected_keys:
            return Response({'detail': 'Invalid API key.'}, status=status.HTTP_403_FORBIDDEN)

        document_id = request.data.get('document_id') or request.data.get('mobile_document_id')
        if not document_id:
            return Response({'detail': 'document_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        status_value = request.data.get('status')
        if status_value not in {UserDocument.Status.APPROVED, UserDocument.Status.REJECTED, UserDocument.Status.PENDING}:
            return Response({'status': 'Invalid document status.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = str(request.data.get('admin_comment') or request.data.get('comment') or '').strip()

        document = UserDocument.objects.select_related('document_type', 'user').filter(pk=document_id).first()
        if document:
            document.status = status_value
            document.admin_comment = comment
            document.reviewed_at = timezone.now()
            document.save(update_fields=['status', 'admin_comment', 'reviewed_at', 'updated_at'])
            return Response(MyDocumentSerializer(document, context={'request': request}).data)

        application_file = (
            ApplicationFile.objects
            .select_related('application', 'application__user', 'uploaded_by')
            .filter(pk=document_id)
            .first()
        )
        if not application_file:
            return Response({'detail': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = application_file.application.user or application_file.uploaded_by
        document_title = application_file.original_name or application_file.get_file_type_display() or str(application_file.file)
        send_document_review_push(
            user=user,
            status_value=status_value,
            document_title=document_title,
            comment=comment,
            related_object_type='application_file',
            related_object_id=application_file.id,
        )
        return Response({
            'id': application_file.id,
            'application_id': application_file.application_id,
            'status': status_value,
            'admin_comment': comment,
            'detail': 'Application file review notification processed.',
        })
