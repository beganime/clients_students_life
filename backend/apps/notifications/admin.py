from django.contrib import admin
from django.contrib import messages
from django import forms
from django.shortcuts import redirect
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils import timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .models import AdminReminder, ClientExam, DeviceToken, PushNotification, UserNotification
from .services import send_admin_reminder, send_push_notification


class AdminReminderForm(forms.ModelForm):
    class Meta:
        model = AdminReminder
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        remind_at = cleaned_data.get('remind_at')
        if not remind_at:
            return cleaned_data
        timezone_name = self.cleaned_data.get('timezone') or 'Asia/Ashgabat'
        try:
            tz = ZoneInfo(timezone_name)
        except ZoneInfoNotFoundError as exc:
            raise forms.ValidationError('Укажите корректный timezone, например Asia/Ashgabat.') from exc

        local_naive = timezone.make_naive(remind_at).replace(tzinfo=None) if timezone.is_aware(remind_at) else remind_at
        cleaned_data['remind_at'] = timezone.make_aware(local_naive, tz)
        return cleaned_data


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


@admin.register(AdminReminder)
class AdminReminderAdmin(admin.ModelAdmin):
    form = AdminReminderForm
    list_display = ('title', 'owner', 'remind_at_local', 'timezone', 'status', 'sent_at', 'test_link', 'send_now_link')
    list_filter = ('status', 'timezone', 'remind_at', 'sent_at')
    search_fields = ('title', 'body', 'owner__username', 'owner__email')
    actions = ('send_selected_now', 'cancel_selected')
    readonly_fields = (
        'owner',
        'status',
        'sent_at',
        'last_error',
        'created_at',
        'updated_at',
        'test_link',
        'send_now_link',
    )
    fieldsets = (
        ('Напоминание', {
            'fields': ('title', 'body'),
            'description': 'Создайте личное напоминание. Тестовая отправка и запланированная отправка идут только владельцу напоминания.',
        }),
        ('Дата и время', {
            'fields': ('remind_at', 'timezone'),
            'description': 'Для Туркменистана оставьте timezone Asia/Ashgabat. Пример: 08.07.2026 19:36 Asia/Ashgabat.',
        }),
        ('Отправка', {
            'fields': ('owner', 'status', 'sent_at', 'test_link', 'send_now_link', 'last_error'),
        }),
        ('Служебное', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request).select_related('owner')
        if request.user.is_superuser:
            return queryset
        return queryset.filter(owner=request.user)

    def save_model(self, request, obj, form, change):
        if not obj.owner_id:
            obj.owner = request.user
        super().save_model(request, obj, form, change)

    def has_change_permission(self, request, obj=None):
        if obj and not request.user.is_superuser and obj.owner_id != request.user.id:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if obj and not request.user.is_superuser and obj.owner_id != request.user.id:
            return False
        return super().has_delete_permission(request, obj)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/send-test/',
                self.admin_site.admin_view(self.send_test_view),
                name='notifications_adminreminder_send_test',
            ),
            path(
                '<path:object_id>/send-now/',
                self.admin_site.admin_view(self.send_now_view),
                name='notifications_adminreminder_send_now',
            ),
        ]
        return custom_urls + urls

    def remind_at_local(self, obj):
        return obj.remind_at_in_timezone().strftime('%d.%m.%Y %H:%M')

    remind_at_local.short_description = 'Дата/время'

    def test_link(self, obj):
        if not obj or not obj.pk:
            return 'Сначала сохраните напоминание.'
        url = reverse('admin:notifications_adminreminder_send_test', args=[obj.pk])
        return format_html('<a class="button" href="{}">Отправить тест себе</a>', url)

    test_link.short_description = 'Тест'

    def send_now_link(self, obj):
        if not obj or not obj.pk:
            return 'Сначала сохраните напоминание.'
        if obj.status == AdminReminder.Status.SENT:
            return 'Уже отправлено'
        url = reverse('admin:notifications_adminreminder_send_now', args=[obj.pk])
        return format_html('<a class="button" href="{}">Отправить сейчас</a>', url)

    send_now_link.short_description = 'Отправить'

    def get_object_for_action(self, request, object_id):
        obj = self.get_object(request, object_id)
        if not obj:
            self.message_user(request, 'Напоминание не найдено.', level=messages.ERROR)
            return None
        if not request.user.is_superuser and obj.owner_id != request.user.id:
            self.message_user(request, 'Можно управлять только своими напоминаниями.', level=messages.ERROR)
            return None
        return obj

    def send_test_view(self, request, object_id):
        reminder = self.get_object_for_action(request, object_id)
        if reminder:
            try:
                send_admin_reminder(reminder, test_user=request.user)
            except Exception as exc:
                self.message_user(request, f'Тестовое уведомление не отправлено: {exc}', level=messages.ERROR)
            else:
                self.message_user(request, 'Тестовое уведомление отправлено только вам.', level=messages.SUCCESS)
        return redirect('admin:notifications_adminreminder_change', object_id)

    def send_now_view(self, request, object_id):
        reminder = self.get_object_for_action(request, object_id)
        if reminder:
            try:
                send_admin_reminder(reminder)
            except Exception as exc:
                self.message_user(request, f'Напоминание не отправлено: {exc}', level=messages.ERROR)
            else:
                self.message_user(request, 'Напоминание отправлено владельцу.', level=messages.SUCCESS)
        return redirect('admin:notifications_adminreminder_change', object_id)

    @admin.action(description='Отправить выбранные напоминания сейчас')
    def send_selected_now(self, request, queryset):
        sent = 0
        for reminder in queryset.filter(status=AdminReminder.Status.PENDING):
            if not request.user.is_superuser and reminder.owner_id != request.user.id:
                continue
            try:
                send_admin_reminder(reminder)
                sent += 1
            except Exception:
                continue
        self.message_user(request, f'Отправлено напоминаний: {sent}.')

    @admin.action(description='Отменить выбранные напоминания')
    def cancel_selected(self, request, queryset):
        if not request.user.is_superuser:
            queryset = queryset.filter(owner=request.user)
        updated = queryset.filter(status=AdminReminder.Status.PENDING).update(status=AdminReminder.Status.CANCELLED)
        self.message_user(request, f'Отменено напоминаний: {updated}.')
