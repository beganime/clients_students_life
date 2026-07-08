from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class DeviceToken(TimeStampedModel):
    class Platform(models.TextChoices):
        IOS = 'ios', 'iOS'
        ANDROID = 'android', 'Android'
        WEB = 'web', 'Web'
        UNKNOWN = 'unknown', 'Unknown'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='device_tokens',
        verbose_name='Пользователь'
    )
    token = models.TextField('FCM token', unique=True)
    platform = models.CharField('Платформа', max_length=20, choices=Platform.choices, default=Platform.UNKNOWN)
    device_id = models.CharField('Device ID', max_length=255, blank=True)
    is_active = models.BooleanField('Активен', default=True)

    class Meta:
        verbose_name = 'Токен устройства'
        verbose_name_plural = 'Токены устройств'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.platform} — {self.user or "anonymous"}'


class PushNotification(TimeStampedModel):
    class TargetType(models.TextChoices):
        ALL = 'all', 'Все пользователи'
        USERS = 'users', 'Выбранные пользователи'
        ANONYMOUS = 'anonymous', 'Анонимные устройства'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        SENT = 'sent', 'Отправлено'
        FAILED = 'failed', 'Ошибка'

    title = models.CharField('Заголовок', max_length=255)
    body = models.TextField('Текст')
    image = models.ImageField('Изображение', upload_to='notifications/', blank=True, null=True)
    target_type = models.CharField('Кому отправить', max_length=50, choices=TargetType.choices, default=TargetType.ALL)
    target_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='target_notifications',
        verbose_name='Пользователи'
    )
    status = models.CharField('Статус', max_length=20, choices=Status.choices, default=Status.DRAFT)
    sent_at = models.DateTimeField('Дата отправки', null=True, blank=True)

    class Meta:
        verbose_name = 'Push-уведомление'
        verbose_name_plural = 'Push-уведомления'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
class UserNotification(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Пользователь'
    )
    title = models.CharField('Заголовок', max_length=255)
    body = models.TextField('Текст')
    notification_type = models.CharField('Тип', max_length=100, blank=True)
    related_object_type = models.CharField('Тип связанного объекта', max_length=100, blank=True)
    related_object_id = models.PositiveIntegerField('ID связанного объекта', null=True, blank=True)
    is_read = models.BooleanField('Прочитано', default=False)

    class Meta:
        verbose_name = 'Уведомление пользователя'
        verbose_name_plural = 'Уведомления пользователей'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} — {self.title}'


class ClientExam(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_exams',
        verbose_name='User',
    )
    subject = models.CharField('Subject', max_length=255)
    exam_date = models.DateField('Exam date')
    exam_time = models.TimeField('Exam time')
    timezone = models.CharField('Timezone', max_length=64, default='Europe/Moscow')
    comment = models.TextField('Manager comment', blank=True)
    reminder_start_at = models.DateTimeField('Reminder start at', null=True, blank=True)
    repeat_until_acknowledged = models.BooleanField('Repeat until acknowledged', default=True)
    acknowledged_at = models.DateTimeField('Acknowledged at', null=True, blank=True)
    acknowledged_by_user = models.BooleanField('Acknowledged by user', default=False)
    is_active = models.BooleanField('Active', default=True)
    created_by_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_client_exams',
        verbose_name='Created by manager',
    )
    manager_sl_exam_id = models.CharField('Manager SL exam ID', max_length=100, blank=True)
    last_reminded_at = models.DateTimeField('Last reminded at', null=True, blank=True)
    next_reminder_at = models.DateTimeField('Next reminder at', null=True, blank=True)

    class Meta:
        verbose_name = 'Client exam'
        verbose_name_plural = 'Client exams'
        ordering = ['exam_date', 'exam_time', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active', 'exam_date']),
            models.Index(fields=['acknowledged_by_user', 'next_reminder_at']),
        ]

    def __str__(self):
        return f'{self.subject} - {self.user}'

    @property
    def starts_at(self):
        return timezone.make_aware(
            timezone.datetime.combine(self.exam_date, self.exam_time),
            timezone.get_current_timezone(),
        )

    def mark_acknowledged(self):
        self.acknowledged_by_user = True
        self.acknowledged_at = timezone.now()
        self.next_reminder_at = None
        self.save(update_fields=['acknowledged_by_user', 'acknowledged_at', 'next_reminder_at', 'updated_at'])

    def compute_next_reminder_at(self, now=None):
        if self.acknowledged_by_user or not self.is_active:
            return None

        now = now or timezone.now()
        exam_at = self.starts_at
        if now >= exam_at:
            return None

        milestones = [
            exam_at - timezone.timedelta(days=7),
            exam_at - timezone.timedelta(days=3),
            exam_at - timezone.timedelta(days=1),
            exam_at - timezone.timedelta(hours=3),
            exam_at - timezone.timedelta(hours=1),
        ]
        future_milestones = [item for item in milestones if item > now]

        if not self.last_reminded_at:
            return self.reminder_start_at if self.reminder_start_at and self.reminder_start_at > now else now

        repeat_at = now + timezone.timedelta(hours=1) if self.repeat_until_acknowledged else None
        candidates = future_milestones
        if repeat_at and repeat_at < exam_at:
            candidates.append(repeat_at)
        return min(candidates) if candidates else None
