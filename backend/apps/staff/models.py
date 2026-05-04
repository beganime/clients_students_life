from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel, SortableModel
from apps.locations.models import Office


class StaffProfile(TimeStampedModel, SortableModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_profile',
        verbose_name='Пользователь'
    )
    office = models.ForeignKey(
        Office,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_members',
        verbose_name='Офис'
    )
    full_name = models.CharField('ФИО', max_length=255)
    position = models.CharField('Должность', max_length=255, blank=True)
    avatar = models.ImageField('Аватар', upload_to='staff/avatars/', blank=True, null=True)
    bio = models.TextField('Описание', blank=True)
    languages = models.CharField('Языки', max_length=255, blank=True)
    specialization = models.CharField('Специализация', max_length=255, blank=True)
    phone = models.CharField('Телефон', max_length=100, blank=True)
    whatsapp = models.CharField('WhatsApp', max_length=100, blank=True)
    telegram = models.CharField('Telegram', max_length=100, blank=True)
    show_contacts = models.BooleanField('Показывать контакты', default=False)
    is_public = models.BooleanField('Показывать в приложении', default=True)

    class Meta:
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'
        ordering = ['sort_order', 'full_name']

    def __str__(self):
        return self.full_name