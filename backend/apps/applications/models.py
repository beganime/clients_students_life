import uuid

from django.conf import settings
from django.db import models
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from apps.common.models import TimeStampedModel
from apps.services.models import Service
from apps.staff.models import StaffProfile
from apps.locations.models import Country, City
from apps.universities.models import University, Program


class Application(TimeStampedModel):
    class Status(models.TextChoices):
        NEW = 'new', 'Новая'
        ACCEPTED = 'accepted', 'Принята'
        MANAGER_ASSIGNED = 'manager_assigned', 'Назначен менеджер'
        CONSULTATION = 'consultation', 'На консультации'
        WAITING_DOCUMENTS = 'waiting_documents', 'Ожидаются документы'
        DOCUMENTS_RECEIVED = 'documents_received', 'Документы получены'
        IN_PROGRESS = 'in_progress', 'В работе'
        SENT_TO_UNIVERSITY = 'sent_to_university', 'Отправлено в университет'
        WAITING_RESPONSE = 'waiting_response', 'Ожидается ответ'
        APPROVED = 'approved', 'Одобрено'
        REJECTED = 'rejected', 'Отказ'
        COMPLETED = 'completed', 'Завершено'
        CLOSED = 'closed', 'Закрыто'

    class ContactMethod(models.TextChoices):
        PHONE = 'phone', 'Телефон'
        WHATSAPP = 'whatsapp', 'WhatsApp'
        TELEGRAM = 'telegram', 'Telegram'
        EMAIL = 'email', 'Email'

    application_number = models.CharField('Номер заявки', max_length=50, unique=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        verbose_name='Пользователь'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        verbose_name='Услуга'
    )
    status = models.CharField('Статус', max_length=50, choices=Status.choices, default=Status.NEW)
    assigned_manager = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_applications',
        verbose_name='Ответственный менеджер'
    )

    full_name = models.CharField('ФИО клиента', max_length=255)
    birth_date = models.DateField('Дата рождения', null=True, blank=True)
    citizenship = models.CharField('Гражданство', max_length=255, blank=True)
    country = models.CharField('Страна проживания', max_length=255, blank=True)
    city = models.CharField('Город проживания', max_length=255, blank=True)
    phone = models.CharField('Телефон', max_length=100, blank=True)
    whatsapp = models.CharField('WhatsApp', max_length=100, blank=True)
    telegram = models.CharField('Telegram', max_length=100, blank=True)
    email = models.EmailField('Email', blank=True)
    preferred_contact_method = models.CharField(
        'Предпочтительный способ связи',
        max_length=50,
        choices=ContactMethod.choices,
        default=ContactMethod.WHATSAPP
    )

    target_country = models.ForeignKey(
        Country,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='target_applications',
        verbose_name='Желаемая страна'
    )
    target_city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='target_applications',
        verbose_name='Желаемый город'
    )
    target_university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        verbose_name='Желаемый университет'
    )
    target_program = models.ForeignKey(
        Program,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        verbose_name='Желаемая программа'
    )

    education_level = models.CharField('Уровень образования', max_length=255, blank=True)
    specialty = models.CharField('Специальность', max_length=255, blank=True)
    study_language = models.CharField('Язык обучения', max_length=100, blank=True)
    start_year = models.CharField('Год начала обучения', max_length=20, blank=True)
    comment = models.TextField('Комментарий', blank=True)

    source = models.CharField('Источник заявки', max_length=100, default='mobile_app')
    ip_address = models.GenericIPAddressField('IP-адрес', null=True, blank=True)
    target_country_external_id = models.PositiveIntegerField('manager-sl country ID', null=True, blank=True)
    target_city_external_id = models.PositiveIntegerField('manager-sl city ID', null=True, blank=True)
    target_university_external_id = models.PositiveIntegerField('manager-sl university ID', null=True, blank=True)
    target_program_external_id = models.PositiveIntegerField('manager-sl program ID', null=True, blank=True)
    target_country_snapshot = models.CharField('Target country snapshot', max_length=255, blank=True)
    target_city_snapshot = models.CharField('Target city snapshot', max_length=255, blank=True)
    target_university_snapshot = models.CharField('Target university snapshot', max_length=255, blank=True)
    target_program_snapshot = models.CharField('Target program snapshot', max_length=255, blank=True)
    manager_sl_application_id = models.CharField('manager-sl application ID', max_length=100, blank=True)
    manager_sl_sync_status = models.CharField(
        'manager-sl sync status',
        max_length=20,
        choices=(
            ('pending', 'Pending'),
            ('synced', 'Synced'),
            ('failed', 'Failed'),
        ),
        default='pending',
    )
    manager_sl_sync_error = models.TextField('manager-sl sync error', blank=True)
    manager_sl_payload = models.JSONField('manager-sl payload', default=dict, blank=True)
    idempotency_key = models.CharField('Idempotency key', max_length=120, unique=True, null=True, blank=True)
    synced_at = models.DateTimeField('Synced at', null=True, blank=True)
    user_agent = models.TextField('User Agent', blank=True)
    device_platform = models.CharField('Платформа устройства', max_length=100, blank=True)

    class Meta:
        verbose_name = 'Заявка'
        verbose_name_plural = 'Заявки'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.application_number:
            self.application_number = f'SL-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.application_number} — {self.full_name}'


class ApplicationFile(TimeStampedModel):
    class FileType(models.TextChoices):
        PASSPORT = 'passport', 'Паспорт'
        CERTIFICATE = 'certificate', 'Аттестат'
        DIPLOMA = 'diploma', 'Диплом'
        TRANSCRIPT = 'transcript', 'Приложение / Transcript'
        PHOTO = 'photo', 'Фото'
        MEDICAL = 'medical', 'Медицинская справка'
        OTHER = 'other', 'Другое'

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Заявка'
    )
    file = models.FileField('Файл', upload_to='applications/files/')
    file_type = models.CharField('Тип файла', max_length=50, choices=FileType.choices, default=FileType.OTHER)
    original_name = models.CharField('Оригинальное имя файла', max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Кем загружен'
    )

    class Meta:
        verbose_name = 'Файл заявки'
        verbose_name_plural = 'Файлы заявок'
        ordering = ['-created_at']

    def __str__(self):
        return self.original_name or str(self.file)
    
class ApplicationStatusHistory(TimeStampedModel):
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name='Заявка'
    )
    old_status = models.CharField('Старый статус', max_length=50, blank=True)
    new_status = models.CharField('Новый статус', max_length=50)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Кто изменил'
    )
    comment = models.TextField('Комментарий', blank=True)

    class Meta:
        verbose_name = 'История статуса заявки'
        verbose_name_plural = 'История статусов заявок'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.application.application_number}: {self.old_status} → {self.new_status}'

@receiver(pre_save, sender=Application)
def store_old_application_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_status = ''
        return

    try:
        old_instance = Application.objects.get(pk=instance.pk)
        instance._old_status = old_instance.status
    except Application.DoesNotExist:
        instance._old_status = ''


@receiver(post_save, sender=Application)
def create_application_status_history(sender, instance, created, **kwargs):
    if created:
        ApplicationStatusHistory.objects.create(
            application=instance,
            old_status='',
            new_status=instance.status,
        )
        return

    old_status = getattr(instance, '_old_status', None)
    if old_status is not None and old_status != instance.status:
            ApplicationStatusHistory.objects.create(
            application=instance,
            old_status=old_status,
            new_status=instance.status,
        )
    if instance.user:
        try:
            from apps.notifications.services import send_push_to_user
            send_push_to_user(
                user=instance.user,
                title='Статус заявки изменён',
                body=f'Заявка {instance.application_number}: новый статус — {instance.get_status_display()}',
                notification_type='application_status',
                related_object_type='application',
                related_object_id=instance.id,
            )
        except Exception:
            pass
