from rest_framework import serializers

from .models import DeviceToken, PushNotification, UserNotification


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ('id', 'token', 'platform', 'device_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'is_active', 'created_at')

    def validate_token(self, value):
        value = str(value or '').strip()
        if len(value) < 16:
            raise serializers.ValidationError('Invalid push token.')
        if len(value) > 4096:
            raise serializers.ValidationError('Push token is too long.')
        return value

    def validate_device_id(self, value):
        return str(value or '').strip()[:255]

    def create(self, validated_data):
        token = validated_data.pop('token')
        obj, _ = DeviceToken.objects.update_or_create(
            token=token,
            defaults=validated_data,
        )
        return obj


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
