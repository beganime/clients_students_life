from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class ClientProfile(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_profile',
        verbose_name='Пользователь'
    )
    phone = models.CharField('Телефон', max_length=100, blank=True)
    whatsapp = models.CharField('WhatsApp', max_length=100, blank=True)
    telegram = models.CharField('Telegram', max_length=100, blank=True)
    country = models.CharField('Страна проживания', max_length=255, blank=True)
    city = models.CharField('Город проживания', max_length=255, blank=True)
    citizenship = models.CharField('Гражданство', max_length=255, blank=True)
    avatar = models.ImageField('Аватар', upload_to='users/avatars/', blank=True, null=True)
    language = models.CharField('Язык приложения', max_length=10, default='ru')

    class Meta:
        verbose_name = 'Профиль клиента'
        verbose_name_plural = 'Профили клиентов'

    def __str__(self):
        return f'Профиль {self.user}'