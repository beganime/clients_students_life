import os
import uuid

from django.conf import settings
from django.db import models
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.common.models import TimeStampedModel, SortableModel


def user_document_upload_to(instance, filename):
    ext = os.path.splitext(filename or '')[1].lower()
    if ext not in {'.pdf', '.jpg', '.jpeg', '.png', '.webp'}:
        ext = '.bin'
    return f'user_documents/{instance.user_id}/{uuid.uuid4().hex}{ext}'


class RequiredDocumentType(TimeStampedModel, SortableModel):
    title = models.CharField('Название документа', max_length=255)
    description = models.TextField('Описание / подсказка', blank=True)
    is_required = models.BooleanField('Обязательный', default=True)
    translation_required = models.BooleanField('Нужен перевод', default=False)
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='required_document_types',
        verbose_name='Услуга',
    )
    country = models.ForeignKey(
        'locations.Country',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='required_document_types',
        verbose_name='Страна / направление',
    )
    category = models.CharField('Категория', max_length=120, blank=True)

    class Meta:
        verbose_name = 'Тип документа клиента'
        verbose_name_plural = 'Типы документов клиентов'
        ordering = ['sort_order', 'title']

    def __str__(self):
        return self.title


class UserDocument(TimeStampedModel):
    class Status(models.TextChoices):
        NOT_UPLOADED = 'not_uploaded', 'Не загружен'
        PENDING = 'pending', 'Отправлен на проверку'
        APPROVED = 'approved', 'Принят'
        REJECTED = 'rejected', 'Не принят'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Пользователь',
    )
    document_type = models.ForeignKey(
        RequiredDocumentType,
        on_delete=models.PROTECT,
        related_name='user_documents',
        verbose_name='Тип документа',
    )
    file = models.FileField('Файл', upload_to=user_document_upload_to, blank=True, null=True)
    original_name = models.CharField('Оригинальное имя файла', max_length=255, blank=True)
    has_translation = models.BooleanField('Есть перевод', default=False)
    status = models.CharField('Статус', max_length=30, choices=Status.choices, default=Status.NOT_UPLOADED)
    admin_comment = models.TextField('Комментарий менеджера', blank=True)
    uploaded_at = models.DateTimeField('Дата загрузки', null=True, blank=True)
    reviewed_at = models.DateTimeField('Дата проверки', null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_user_documents',
        verbose_name='Проверил',
    )
    manager_sl_document_id = models.CharField('Manager SL document ID', max_length=100, blank=True)
    manager_sl_sync_status = models.CharField(
        'Manager SL sync status',
        max_length=20,
        choices=(('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')),
        default='pending',
    )
    manager_sl_sync_error = models.TextField('Manager SL sync error', blank=True)

    class Meta:
        verbose_name = 'Документ клиента'
        verbose_name_plural = 'Документы клиентов'
        ordering = ['document_type__sort_order', 'document_type__title']
        constraints = [
            models.UniqueConstraint(fields=['user', 'document_type'], name='unique_user_document_type'),
        ]

    def __str__(self):
        return f'{self.user} — {self.document_type}'

    def mark_uploaded(self, original_name=''):
        self.original_name = original_name[:255]
        self.status = self.Status.PENDING
        self.admin_comment = ''
        self.uploaded_at = timezone.now()
        self.reviewed_at = None
        self.reviewed_by = None
        self.manager_sl_sync_status = 'pending'


@receiver(pre_save, sender=UserDocument)
def store_old_user_document_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_status = ''
        return
    try:
        old = UserDocument.objects.get(pk=instance.pk)
        instance._old_status = old.status
    except UserDocument.DoesNotExist:
        instance._old_status = ''


@receiver(post_save, sender=UserDocument)
def notify_user_document_review(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', '')
    if created or old_status == instance.status or instance.status not in {UserDocument.Status.APPROVED, UserDocument.Status.REJECTED}:
        return

    try:
        from apps.notifications.services import send_push_to_user

        if instance.status == UserDocument.Status.APPROVED:
            title = 'Документ принят'
            body = 'Ваш документ успешно проверен и принят.'
        else:
            title = 'Документ не подходит'
            body = 'Ваш документ не принят. Посмотрите комментарий менеджера и загрузите исправленный файл.'

        send_push_to_user(
            user=instance.user,
            title=title,
            body=body,
            notification_type='documents',
            related_object_type='user_document',
            related_object_id=instance.id,
        )
    except Exception:
        pass
