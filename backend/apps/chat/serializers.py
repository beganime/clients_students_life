from rest_framework import serializers

from apps.accounts.models import AppUserActivity, is_manager_user
from apps.accounts.serializers import AppUserActivitySerializer
from apps.applications.file_utils import validate_application_file
from apps.staff.serializers import StaffProfileSerializer

from .image_utils import prepare_chat_image
from .models import ChatAttachment, ChatMessage, ChatRoom


class ChatAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ChatAttachment
        fields = (
            'id',
            'url',
            'original_name',
            'content_type',
            'size',
            'width',
            'height',
            'created_at',
        )

    def get_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_staff = StaffProfileSerializer(read_only=True)
    sender_user_name = serializers.CharField(source='sender_user.get_full_name', read_only=True)
    sender_role = serializers.SerializerMethodField()
    sender_display_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    attachments = ChatAttachmentSerializer(many=True, read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            'id',
            'room',
            'sender_user',
            'sender_user_name',
            'sender_staff',
            'sender_role',
            'sender_display_name',
            'message_type',
            'text',
            'file',
            'attachments',
            'is_mine',
            'is_read',
            'created_at',
        )
        read_only_fields = (
            'id',
            'room',
            'sender_user',
            'sender_staff',
            'sender_role',
            'sender_display_name',
            'file',
            'attachments',
            'is_mine',
            'is_read',
            'created_at',
        )

    def get_sender_role(self, obj):
        if obj.sender_staff_id:
            return 'manager'
        if obj.sender_user and is_manager_user(obj.sender_user):
            return 'manager'
        return 'user'

    def get_sender_display_name(self, obj):
        if obj.sender_staff_id:
            return obj.sender_staff.full_name
        if obj.sender_user_id:
            full_name = obj.sender_user.get_full_name()
            return full_name or obj.sender_user.email or obj.sender_user.username
        return ''

    def get_is_mine(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and obj.sender_user_id == user.id)

    def get_file(self, obj):
        attachment = obj.attachments.first()
        if attachment:
            return ChatAttachmentSerializer(attachment, context=self.context).data.get('url')
        if obj.file:
            request = self.context.get('request')
            url = obj.file.url
            return request.build_absolute_uri(url) if request else url
        return None


class ChatMessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True, max_length=4000)
    image = serializers.ImageField(required=False, allow_null=True)
    file = serializers.FileField(required=False, allow_null=True)

    def validate(self, attrs):
        text = attrs.get('text', '').strip()
        image = attrs.get('image')
        file = attrs.get('file')
        if image and file:
            raise serializers.ValidationError('Прикрепите либо фото, либо файл.')
        if file:
            validate_application_file(file)
        if not text and not image and not file:
            raise serializers.ValidationError('Напишите сообщение или приложите файл.')
        attrs['text'] = text
        return attrs

    def create_message(self, *, room, sender_user, sender_staff=None):
        image = self.validated_data.get('image')
        file = self.validated_data.get('file')
        text = self.validated_data.get('text', '')
        message = ChatMessage.objects.create(
            room=room,
            sender_user=sender_user,
            sender_staff=sender_staff,
            message_type=(
                ChatMessage.MessageType.IMAGE
                if image
                else ChatMessage.MessageType.FILE if file else ChatMessage.MessageType.TEXT
            ),
            text=text,
            file=file if file else None,
        )
        if image:
            attachment_data = prepare_chat_image(image)
            ChatAttachment.objects.create(message=message, **attachment_data)
        return message


class ChatRoomSerializer(serializers.ModelSerializer):
    user = serializers.IntegerField(source='user_id', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_activity = serializers.SerializerMethodField()
    assigned_manager = StaffProfileSerializer(read_only=True)
    application_number = serializers.CharField(source='application.application_number', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = (
            'id',
            'user',
            'user_name',
            'user_email',
            'user_activity',
            'application',
            'application_number',
            'assigned_manager',
            'status',
            'last_message',
            'unread_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'assigned_manager', 'created_at', 'updated_at')

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or obj.user.email or obj.user.username

    def get_user_activity(self, obj):
        try:
            activity = obj.user.app_activity
        except AppUserActivity.DoesNotExist:
            return None
        return AppUserActivitySerializer(activity).data

    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        if not message:
            return None
        return ChatMessageSerializer(message, context=self.context).data

    def get_unread_count(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        qs = obj.messages.filter(is_read=False)
        if user and user.is_authenticated:
            qs = qs.exclude(sender_user=user)
        return qs.count()
