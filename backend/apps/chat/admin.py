from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import ChatAttachment, ChatMessage, ChatRoom


class ChatAttachmentInline(TabularInline):
    model = ChatAttachment
    extra = 0
    readonly_fields = ('original_name', 'content_type', 'size', 'width', 'height', 'created_at', 'updated_at')


class ChatMessageInline(TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('created_at', 'updated_at')
    show_change_link = True


@admin.register(ChatRoom)
class ChatRoomAdmin(ModelAdmin):
    list_display = ('id', 'user', 'application', 'assigned_manager', 'status', 'updated_at')
    list_filter = ('status', 'assigned_manager', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'application__application_number')
    autocomplete_fields = ('user', 'application', 'assigned_manager')
    inlines = [ChatMessageInline]
    ordering = ('-updated_at',)


@admin.register(ChatMessage)
class ChatMessageAdmin(ModelAdmin):
    list_display = ('id', 'room', 'sender_user', 'sender_staff', 'message_type', 'is_read', 'created_at')
    list_filter = ('message_type', 'is_read', 'created_at')
    search_fields = ('text', 'sender_user__username', 'sender_staff__full_name')
    autocomplete_fields = ('room', 'sender_user', 'sender_staff')
    inlines = [ChatAttachmentInline]
    ordering = ('-created_at',)


@admin.register(ChatAttachment)
class ChatAttachmentAdmin(ModelAdmin):
    list_display = ('id', 'message', 'original_name', 'content_type', 'size', 'width', 'height', 'created_at')
    list_filter = ('content_type', 'created_at')
    search_fields = ('original_name', 'message__text', 'message__sender_user__email')
    autocomplete_fields = ('message',)
    readonly_fields = ('size', 'width', 'height', 'created_at', 'updated_at')
