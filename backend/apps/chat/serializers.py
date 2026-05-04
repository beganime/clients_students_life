from rest_framework import serializers

from apps.staff.serializers import StaffProfileSerializer
from .models import ChatMessage, ChatRoom


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_staff = StaffProfileSerializer(read_only=True)
    sender_user_name = serializers.CharField(source='sender_user.get_full_name', read_only=True)

    class Meta:
        model = ChatMessage
        fields = (
            'id',
            'room',
            'sender_user',
            'sender_user_name',
            'sender_staff',
            'message_type',
            'text',
            'file',
            'is_read',
            'created_at',
        )
        read_only_fields = ('id', 'room', 'sender_user', 'sender_staff', 'is_read', 'created_at')


class ChatRoomSerializer(serializers.ModelSerializer):
    assigned_manager = StaffProfileSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = (
            'id',
            'application',
            'assigned_manager',
            'status',
            'last_message',
            'created_at',
            'updated_at',
        )

    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        if not message:
            return None
        return ChatMessageSerializer(message, context=self.context).data