from django.conf import settings
from django.db import models

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