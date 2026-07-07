from django.contrib.auth import get_user_model
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClientExam, DeviceToken, PushNotification, UserNotification
from .serializers import ClientExamSerializer, DeviceTokenSerializer, PushNotificationSerializer, UserNotificationSerializer
from .services import send_exam_reminder
from apps.accounts.models import is_manager_user
from apps.documents.views import has_manager_or_service_access


User = get_user_model()


class DeviceTokenViewSet(mixins.CreateModelMixin,
                         mixins.ListModelMixin,
                         mixins.DestroyModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = DeviceTokenSerializer

    def get_throttles(self):
        if self.action == 'create':
            self.throttle_scope = 'push_token'
        return super().get_throttles()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if is_manager_user(self.request.user):
            return DeviceToken.objects.all().order_by('-created_at')
        return DeviceToken.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        token = serializer.validated_data.get('token')
        DeviceToken.objects.filter(token=token).update(is_active=False)
        serializer.save(user=user, is_active=True)


class PushNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PushNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return PushNotification.objects.all().order_by('-created_at')
        return PushNotification.objects.filter(status=PushNotification.Status.SENT).order_by('-created_at')
    
class UserNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ('-created_at',)

    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'ok'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'ok'})


class MyExamListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        exams = ClientExam.objects.filter(user=request.user, is_active=True).order_by('exam_date', 'exam_time')
        return Response(ClientExamSerializer(exams, many=True, context={'request': request}).data)


class MyExamAcknowledgeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        exam = ClientExam.objects.filter(pk=exam_id, user=request.user, is_active=True).first()
        if not exam:
            return Response({'detail': 'Exam not found.'}, status=status.HTTP_404_NOT_FOUND)
        exam.mark_acknowledged()
        return Response(ClientExamSerializer(exam, context={'request': request}).data)


class ServiceClientExamListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_user(self, client_id):
        return User.objects.filter(pk=client_id).first()

    def get(self, request, client_id):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        user = self.get_user(client_id)
        if not user:
            return Response({'detail': 'Client user not found.'}, status=status.HTTP_404_NOT_FOUND)
        exams = ClientExam.objects.filter(user=user).order_by('-created_at')
        return Response(ClientExamSerializer(exams, many=True, context={'request': request}).data)

    def post(self, request, client_id):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        user = self.get_user(client_id)
        if not user:
            return Response({'detail': 'Client user not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClientExamSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        created_by = request.user if request.user and request.user.is_authenticated else None
        exam = serializer.save(user=user, created_by_manager=created_by)
        exam.next_reminder_at = exam.compute_next_reminder_at()
        exam.save(update_fields=['next_reminder_at', 'updated_at'])
        send_exam_reminder(exam, force=True)
        return Response(ClientExamSerializer(exam, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ServiceClientExamDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_exam(self, exam_id):
        return ClientExam.objects.select_related('user').filter(pk=exam_id).first()

    def patch(self, request, exam_id):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_exam(exam_id)
        if not exam:
            return Response({'detail': 'Exam not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClientExamSerializer(exam, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        exam = serializer.save()
        if not exam.acknowledged_by_user:
            exam.next_reminder_at = exam.compute_next_reminder_at()
            exam.save(update_fields=['next_reminder_at', 'updated_at'])
        return Response(ClientExamSerializer(exam, context={'request': request}).data)

    def delete(self, request, exam_id):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_exam(exam_id)
        if not exam:
            return Response({'detail': 'Exam not found.'}, status=status.HTTP_404_NOT_FOUND)
        exam.is_active = False
        exam.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
