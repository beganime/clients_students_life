from django.conf import settings
from django.db import models

from apps.applications.models import Application
from apps.common.models import TimeStampedModel
from apps.staff.models import StaffProfile


class ChatRoom(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = 'open', 'Открыт'
        CLOSED = 'closed', 'Закрыт'
        BLOCKED = 'blocked', 'Заблокирован'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms',
        verbose_name='Пользователь'
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_rooms',
        verbose_name='Заявка'
    )
    assigned_manager = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_rooms',
        verbose_name='Менеджер'
    )
    status = models.CharField('Статус', max_length=20, choices=Status.choices, default=Status.OPEN)

    class Meta:
        verbose_name = 'Чат'
        verbose_name_plural = 'Чаты'
        ordering = ['-updated_at']

    def __str__(self):
        return f'Чат #{self.id} — {self.user}'


class ChatMessage(TimeStampedModel):
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Текст'
        IMAGE = 'image', 'Изображение'
        FILE = 'file', 'Файл'

    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Чат'
    )
    sender_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_chat_messages',
        verbose_name='Отправитель пользователь'
    )
    sender_staff = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_chat_messages',
        verbose_name='Отправитель сотрудник'
    )
    message_type = models.CharField('Тип сообщения', max_length=20, choices=MessageType.choices, default=MessageType.TEXT)
    text = models.TextField('Текст', blank=True)
    file = models.FileField('Файл', upload_to='chat/files/', blank=True, null=True)
    is_read = models.BooleanField('Прочитано', default=False)

    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']

    def __str__(self):
        return f'Сообщение #{self.id}'