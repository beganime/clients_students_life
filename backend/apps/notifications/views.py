from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DeviceToken, PushNotification, UserNotification
from .serializers import DeviceTokenSerializer, PushNotificationSerializer, UserNotificationSerializer


class DeviceTokenViewSet(mixins.CreateModelMixin,
                         mixins.ListModelMixin,
                         mixins.DestroyModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = DeviceTokenSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_staff:
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