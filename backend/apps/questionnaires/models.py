import os
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


def questionnaire_photo_upload_to(instance, filename):
    ext = os.path.splitext(filename or '')[1].lower()
    if ext not in {'.jpg', '.jpeg', '.png', '.webp'}:
        ext = '.jpg'
    return f'questionnaires/{instance.user_id}/photo-{uuid.uuid4().hex}{ext}'


def questionnaire_attachment_upload_to(instance, filename):
    ext = os.path.splitext(filename or '')[1].lower()
    if ext not in {'.pdf', '.jpg', '.jpeg', '.png', '.webp'}:
        ext = '.bin'
    return f'questionnaires/{instance.questionnaire.user_id}/attachments/{uuid.uuid4().hex}{ext}'


def questionnaire_document_upload_to(instance, filename):
    return f'questionnaires/{instance.user_id}/generated/{uuid.uuid4().hex}-{filename}'


class ApplicantQuestionnaire(TimeStampedModel):
    class FormType(models.TextChoices):
        SCHOOL_STUDENT = 'school_student', 'Школьник / предварительная заявка'
        APPLICANT = 'applicant', 'Абитуриент / полная анкета'

    class Gender(models.TextChoices):
        MALE = 'male', 'Мужской'
        FEMALE = 'female', 'Женский'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        COMPLETED = 'completed', 'Заполнена'
        SUBMITTED = 'submitted', 'Отправлена на проверку'
        APPROVED = 'approved', 'Принята'
        REJECTED = 'rejected', 'Отклонена'
        UPDATED = 'updated', 'Обновлена'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applicant_questionnaire',
        verbose_name='Пользователь',
    )

    status = models.CharField('Статус анкеты', max_length=20, choices=Status.choices, default=Status.DRAFT)
    form_type = models.CharField('Тип заявки', max_length=32, choices=FormType.choices, default=FormType.APPLICANT, db_index=True)

    full_name = models.CharField('Полное ФИО', max_length=255, blank=True)
    birth_date = models.DateField('Дата рождения', null=True, blank=True)
    gender = models.CharField('Пол', max_length=20, choices=Gender.choices, blank=True)
    citizenship = models.CharField('Гражданство', max_length=120, blank=True)
    marital_status = models.CharField('Семейное положение', max_length=120, blank=True)
    face_photo = models.ImageField('Фотография лица', upload_to=questionnaire_photo_upload_to, blank=True, null=True)

    residence_country = models.CharField('Страна проживания', max_length=120, blank=True)
    residence_region = models.CharField('Область / регион', max_length=160, blank=True)
    residence_city = models.CharField('Город / населенный пункт', max_length=160, blank=True)
    residence_street = models.CharField('Улица', max_length=180, blank=True)
    residence_house = models.CharField('Дом / квартира', max_length=80, blank=True)
    residence_postal_code = models.CharField('Почтовый индекс', max_length=40, blank=True)

    passport_number = models.CharField('Паспорт серия и номер', max_length=120, blank=True)
    passport_issued_by = models.CharField('Где оформлен паспорт', max_length=255, blank=True)
    passport_issue_date = models.DateField('Дата начала действия паспорта', null=True, blank=True)
    passport_expiry_date = models.DateField('Дата окончания действия паспорта', null=True, blank=True)

    phone = models.CharField('Основной номер телефона', max_length=80, blank=True)
    email = models.EmailField('Email', blank=True)
    extra_phone = models.CharField('Дополнительный номер телефона', max_length=80, blank=True)
    imo = models.CharField('Imo', max_length=120, blank=True)
    telegram = models.CharField('Telegram', max_length=120, blank=True)
    preferred_contact_method = models.CharField('Предпочтительный способ связи', max_length=40, blank=True)

    parent_full_name = models.CharField('ФИО родителя', max_length=255, blank=True)
    parent_relation = models.CharField('Кем является', max_length=120, blank=True)
    parent_contacts = models.CharField('Контакты родителя', max_length=180, blank=True)
    parent_workplace = models.CharField('Кем и где работает родитель', max_length=255, blank=True)
    family_members = models.CharField('В семье имеется', max_length=120, blank=True)

    education_level = models.CharField('Уровень образования', max_length=120, blank=True)
    school_class = models.CharField('Класс', max_length=40, blank=True)
    school_name = models.CharField('Учебное заведение', max_length=255, blank=True)
    school_country = models.CharField('Страна учебного заведения', max_length=120, blank=True)
    school_city = models.CharField('Город учебного заведения', max_length=120, blank=True)
    graduation_year = models.CharField('Год окончания', max_length=20, blank=True)
    education_status = models.CharField('Статус обучения', max_length=80, blank=True)

    achievements = models.JSONField('Достижения', default=list, blank=True)
    languages = models.JSONField('Языки', default=list, blank=True)

    desired_program = models.CharField('Желаемая программа / Вуз', max_length=255, blank=True)
    admission_goal = models.TextField('Цель поступления', blank=True)
    desired_city = models.CharField('Желаемый город поступления', max_length=120, blank=True)
    desired_country = models.CharField('Желаемая страна поступления', max_length=120, blank=True)
    desired_language = models.CharField('Желаемый язык обучения', max_length=120, blank=True)
    desired_education_level = models.CharField('Желаемый уровень обучения', max_length=120, blank=True)
    admission_urgency = models.CharField('Срочность поступления', max_length=80, blank=True)
    help_needed = models.JSONField('Нужна помощь с', default=list, blank=True)

    has_visa = models.CharField('Виза имеется или нет', max_length=60, blank=True)
    visa_country = models.CharField('Страна оформления визы', max_length=120, blank=True)
    visa_city = models.CharField('Город оформления визы', max_length=120, blank=True)
    visa_valid_until = models.DateField('Срок действия визы', null=True, blank=True)
    has_international_passport = models.CharField('Есть действующий загранпаспорт', max_length=80, blank=True)

    hobbies = models.TextField('Любимые хобби', blank=True)
    applicant_comment = models.TextField('Дополнительный комментарий от абитуриента', blank=True)
    referral_source = models.CharField('Откуда узнали о Student’s Life', max_length=120, blank=True)
    data_processing_consent = models.BooleanField('Согласие на обработку данных', default=False)
    submitted_at = models.DateTimeField('Дата заполнения', null=True, blank=True)

    manager_sl_questionnaire_id = models.CharField('Manager SL questionnaire ID', max_length=100, blank=True)
    manager_sl_document_url = models.URLField('Manager SL generated document URL', max_length=1000, blank=True)
    generated_document = models.FileField('Сгенерированный документ анкеты', upload_to=questionnaire_document_upload_to, blank=True, null=True)
    generated_document_at = models.DateTimeField('Дата генерации документа', null=True, blank=True)
    manager_sl_sync_status = models.CharField(
        'Manager SL sync status',
        max_length=20,
        choices=(('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')),
        default='pending',
    )
    manager_sl_sync_error = models.TextField('Manager SL sync error', blank=True)

    class Meta:
        verbose_name = 'Анкета абитуриента'
        verbose_name_plural = 'Анкеты абитуриентов'
        ordering = ['-updated_at']

    def __str__(self):
        return self.full_name or self.user.get_full_name() or self.user.email or str(self.user)

    def mark_submitted(self):
        self.status = self.Status.UPDATED if self.submitted_at else self.Status.SUBMITTED
        if not self.submitted_at:
            self.submitted_at = timezone.now()
        self.manager_sl_sync_status = 'pending'

    def mark_completed(self):
        self.mark_submitted()

    def mark_draft(self):
        if self.status not in {self.Status.SUBMITTED, self.Status.APPROVED, self.Status.REJECTED, self.Status.UPDATED}:
            self.status = self.Status.DRAFT

    def missing_required_fields(self):
        if self.form_type == self.FormType.SCHOOL_STUDENT:
            required = (
                'full_name',
                'birth_date',
                'phone',
                'citizenship',
                'residence_country',
                'residence_city',
                'school_class',
                'school_name',
                'graduation_year',
                'desired_country',
                'desired_program',
                'parent_full_name',
                'parent_contacts',
                'data_processing_consent',
            )
        else:
            required = (
                'full_name',
                'birth_date',
                'gender',
                'citizenship',
                'marital_status',
                'residence_country',
                'residence_city',
                'passport_number',
                'passport_issued_by',
                'passport_issue_date',
                'passport_expiry_date',
                'phone',
                'email',
                'parent_full_name',
                'parent_contacts',
                'education_level',
                'school_name',
                'school_country',
                'school_city',
                'graduation_year',
                'education_status',
                'desired_program',
                'desired_country',
                'desired_city',
                'desired_language',
                'desired_education_level',
                'preferred_contact_method',
                'admission_urgency',
                'data_processing_consent',
            )
        missing = []
        for field in required:
            value = getattr(self, field)
            if value in (None, '', [], {}, False):
                missing.append(field)
        if self.education_status in {'school_student', 'школьник'} and not self.school_class:
            missing.append('school_class')
        return sorted(set(missing))

    def generate_document(self):
        from django.core.files.base import ContentFile

        from .document_generator import generate_questionnaire_docx

        content = generate_questionnaire_docx(self)
        filename = 'school-student-application.docx' if self.form_type == self.FormType.SCHOOL_STUDENT else 'applicant-questionnaire.docx'
        self.generated_document.save(filename, ContentFile(content), save=False)
        self.generated_document_at = timezone.now()
        self.manager_sl_sync_status = 'pending'
        return self.generated_document


class QuestionnaireAttachment(TimeStampedModel):
    questionnaire = models.ForeignKey(
        ApplicantQuestionnaire,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Анкета',
    )
    file = models.FileField('Файл', upload_to=questionnaire_attachment_upload_to)
    original_name = models.CharField('Оригинальное имя файла', max_length=255, blank=True)
    file_type = models.CharField('Тип файла', max_length=100, blank=True)

    class Meta:
        verbose_name = 'Вложение анкеты'
        verbose_name_plural = 'Вложения анкеты'
        ordering = ['-created_at']

    def __str__(self):
        return self.original_name or self.file.name
