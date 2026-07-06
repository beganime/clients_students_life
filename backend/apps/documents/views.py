from django.utils import timezone
from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import is_manager_user

from .models import RequiredDocumentType, UserDocument
from .manager_sl_sync import sync_user_document_to_manager_sl
from .serializers import MyDocumentSerializer, RequiredDocumentTypeSerializer, UserDocumentUploadSerializer


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
        expected_key = getattr(settings, 'MANAGER_SL_LEADS_API_KEY', '') or getattr(settings, 'MANAGER_SL_API_KEY', '')
        if not expected_key or request.headers.get('X-API-KEY') != expected_key:
            return Response({'detail': 'Invalid API key.'}, status=status.HTTP_403_FORBIDDEN)

        document_id = request.data.get('document_id') or request.data.get('mobile_document_id')
        document = UserDocument.objects.filter(pk=document_id).first()
        if not document:
            return Response({'detail': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        if status_value not in {UserDocument.Status.APPROVED, UserDocument.Status.REJECTED, UserDocument.Status.PENDING}:
            return Response({'status': 'Invalid document status.'}, status=status.HTTP_400_BAD_REQUEST)

        document.status = status_value
        document.admin_comment = str(request.data.get('admin_comment') or request.data.get('comment') or '').strip()
        document.reviewed_at = timezone.now()
        document.save(update_fields=['status', 'admin_comment', 'reviewed_at', 'updated_at'])
        return Response(MyDocumentSerializer(document, context={'request': request}).data)
