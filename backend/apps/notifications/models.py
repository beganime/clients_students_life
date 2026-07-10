from django.conf import settings
from django.db import models
from django.utils import timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

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
        verbose_name='Пользователь',
    )
    subject = models.CharField('Предмет экзамена', max_length=255)
    exam_date = models.DateField('Дата экзамена')
    exam_time = models.TimeField('Время экзамена')
    timezone = models.CharField('Часовой пояс', max_length=64, default='Asia/Ashgabat')
    comment = models.TextField('Комментарий менеджера', blank=True)
    reminder_start_at = models.DateTimeField('Начать напоминать с', null=True, blank=True)
    repeat_until_acknowledged = models.BooleanField('Повторять до подтверждения', default=True)
    acknowledged_at = models.DateTimeField('Дата подтверждения', null=True, blank=True)
    acknowledged_by_user = models.BooleanField('Пользователь подтвердил', default=False)
    is_active = models.BooleanField('Активен', default=True)
    target_devices = models.ManyToManyField(
        DeviceToken,
        blank=True,
        related_name='client_exams',
        verbose_name='Устройства для push',
        help_text='Если выбрать устройства, push уйдёт только на них. Если оставить пустым, push уйдёт на все активные устройства пользователя.',
    )
    created_by_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_client_exams',
        verbose_name='Создал менеджер',
    )
    manager_sl_exam_id = models.CharField('Manager SL exam ID', max_length=100, blank=True)
    last_reminded_at = models.DateTimeField('Последнее напоминание', null=True, blank=True)
    next_reminder_at = models.DateTimeField('Следующее напоминание', null=True, blank=True)

    class Meta:
        verbose_name = 'Экзамен клиента'
        verbose_name_plural = 'Экзамены клиентов'
        ordering = ['exam_date', 'exam_time', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active', 'exam_date']),
            models.Index(fields=['acknowledged_by_user', 'next_reminder_at']),
        ]

    def __str__(self):
        return f'{self.subject} - {self.user}'

    @property
    def starts_at(self):
        try:
            tz = ZoneInfo(self.timezone)
        except ZoneInfoNotFoundError:
            tz = ZoneInfo('Asia/Ashgabat')
        return timezone.make_aware(
            timezone.datetime.combine(self.exam_date, self.exam_time),
            tz,
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


class AdminReminder(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает отправки'
        SENT = 'sent', 'Отправлено'
        CANCELLED = 'cancelled', 'Отменено'
        FAILED = 'failed', 'Ошибка'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_reminders',
        verbose_name='Менеджер',
    )
    title = models.CharField('Заголовок', max_length=255, default='Напоминание об экзамене')
    body = models.TextField('Текст уведомления')
    remind_at = models.DateTimeField('Дата и время уведомления')
    timezone = models.CharField('Часовой пояс', max_length=64, default='Asia/Ashgabat')
    status = models.CharField('Статус', max_length=20, choices=Status.choices, default=Status.PENDING)
    sent_at = models.DateTimeField('Дата отправки', null=True, blank=True)
    last_error = models.TextField('Последняя ошибка', blank=True)

    class Meta:
        verbose_name = 'Напоминание менеджера'
        verbose_name_plural = 'Календарь напоминаний'
        ordering = ['-remind_at']
        indexes = [
            models.Index(fields=['owner', 'status', 'remind_at']),
            models.Index(fields=['status', 'remind_at']),
        ]

    def __str__(self):
        return f'{self.title} - {self.owner}'

    def remind_at_in_timezone(self):
        try:
            tz = ZoneInfo(self.timezone)
        except ZoneInfoNotFoundError:
            tz = ZoneInfo('Asia/Ashgabat')
        return timezone.localtime(self.remind_at, tz)
