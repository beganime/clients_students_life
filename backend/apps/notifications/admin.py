from django.contrib import admin
from django.contrib import messages
from django.shortcuts import redirect
from django.urls import path, reverse
from django.utils.html import format_html

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
    list_display = ('title', 'target_type', 'status', 'sent_at', 'created_at', 'send_now_link')
    list_filter = ('target_type', 'status', 'created_at')
    search_fields = ('title', 'body')
    filter_horizontal = ('target_users',)
    actions = ('send_now',)
    readonly_fields = ('status', 'sent_at', 'created_at', 'updated_at', 'send_now_link')
    fieldsets = (
        ('Текст уведомления', {
            'fields': ('title', 'body', 'image'),
            'description': 'Заполните заголовок и текст. Это уведомление появится внутри приложения и, если есть FCM token, уйдет push-сообщением.',
        }),
        ('Получатели', {
            'fields': ('target_type', 'target_users'),
            'description': 'Для массовой рассылки выберите "Все пользователи". Для выборочной рассылки выберите "Выбранные пользователи" и отметьте нужных людей.',
        }),
        ('Отправка', {
            'fields': ('status', 'sent_at', 'send_now_link'),
            'description': 'После сохранения нажмите ссылку "Отправить сейчас". Также можно выбрать уведомления в списке и выполнить действие "Отправить выбранные push-уведомления сейчас".',
        }),
        ('Служебное', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/send-now/',
                self.admin_site.admin_view(self.send_now_view),
                name='notifications_pushnotification_send_now',
            ),
        ]
        return custom_urls + urls

    def send_now_link(self, obj):
        if not obj or not obj.pk:
            return 'Сначала сохраните уведомление.'
        url = reverse('admin:notifications_pushnotification_send_now', args=[obj.pk])
        return format_html('<a class="button" href="{}">Отправить сейчас</a>', url)

    send_now_link.short_description = 'Отправить'

    def send_now_view(self, request, object_id):
        notification = self.get_object(request, object_id)
        if not notification:
            self.message_user(request, 'Уведомление не найдено.', level=messages.ERROR)
            return redirect('admin:notifications_pushnotification_changelist')
        try:
            result = send_push_notification(notification)
        except Exception as exc:
            notification.status = PushNotification.Status.FAILED
            notification.save(update_fields=['status', 'updated_at'])
            self.message_user(request, f'Не удалось отправить уведомление: {exc}', level=messages.ERROR)
        else:
            self.message_user(
                request,
                f'Уведомление отправлено. Внутренних уведомлений: {result["internal_created"]}; push: {result["push_sent"]}.',
                level=messages.SUCCESS,
            )
        return redirect('admin:notifications_pushnotification_change', object_id)

    @admin.action(description='Отправить выбранные push-уведомления сейчас')
    def send_now(self, request, queryset):
        total_internal = 0
        total_push = 0
        failed = 0
        for notification in queryset:
            try:
                result = send_push_notification(notification)
                total_internal += result['internal_created']
                total_push += result['push_sent']
            except Exception:
                failed += 1
                notification.status = PushNotification.Status.FAILED
                notification.save(update_fields=['status', 'updated_at'])
        self.message_user(
            request,
            f'Отправка завершена. Внутренних уведомлений: {total_internal}; push: {total_push}; ошибок: {failed}.',
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
