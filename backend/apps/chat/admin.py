from django.contrib import admin

from .models import ChatRoom, ChatMessage


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'application', 'assigned_manager', 'status', 'updated_at')
    list_filter = ('status', 'assigned_manager', 'created_at')
    search_fields = ('user__username', 'user__email', 'application__application_number')
    inlines = [ChatMessageInline]
    ordering = ('-updated_at',)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'sender_user', 'sender_staff', 'message_type', 'is_read', 'created_at')
    list_filter = ('message_type', 'is_read', 'created_at')
    search_fields = ('text', 'sender_user__username', 'sender_staff__full_name')
    ordering = ('-created_at',)