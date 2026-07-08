from django.contrib import admin

from .models import ClientExam, DeviceToken, PushNotification, UserNotification
from .services import send_push_notification


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'platform', 'device_id', 'is_active', 'created_at')
    list_filter = ('platform', 'is_active', 'created_at')
    search_fields = ('user__username', 'user__email', 'token', 'device_id')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PushNotification)
class PushNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'target_type', 'status', 'sent_at', 'created_at')
    list_filter = ('target_type', 'status', 'created_at')
    search_fields = ('title', 'body')
    filter_horizontal = ('target_users',)
    actions = ('send_now',)

    @admin.action(description='Send selected push notifications now')
    def send_now(self, request, queryset):
        total_internal = 0
        total_push = 0
        for notification in queryset:
            result = send_push_notification(notification)
            total_internal += result['internal_created']
            total_push += result['push_sent']
        self.message_user(
            request,
            f'Sent notifications. Internal: {total_internal}; FCM pushes: {total_push}.',
        )
    
@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'title', 'body')


@admin.register(ClientExam)
class ClientExamAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'exam_date', 'exam_time', 'acknowledged_by_user', 'is_active', 'next_reminder_at')
    list_filter = ('is_active', 'acknowledged_by_user', 'exam_date')
    search_fields = ('user__username', 'user__email', 'subject', 'comment')
    readonly_fields = ('created_at', 'updated_at', 'last_reminded_at', 'next_reminder_at', 'acknowledged_at')
