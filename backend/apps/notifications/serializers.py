from rest_framework import serializers

from .models import DeviceToken, PushNotification, UserNotification


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ('id', 'token', 'platform', 'device_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'is_active', 'created_at')


class PushNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushNotification
        fields = ('id', 'title', 'body', 'image', 'target_type', 'status', 'sent_at', 'created_at')
        
class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = (
            'id',
            'title',
            'body',
            'notification_type',
            'related_object_type',
            'related_object_id',
            'is_read',
            'created_at',
        )