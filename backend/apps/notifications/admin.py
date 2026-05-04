from django.contrib import admin

from .models import DeviceToken, PushNotification, UserNotification


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
    
@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'title', 'body')