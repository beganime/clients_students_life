from django.db import models
from django.utils.text import slugify
from django.conf import settings

from apps.common.models import TimeStampedModel, SortableModel, SeoModel
from apps.locations.models import Country, City


class University(TimeStampedModel, SortableModel, SeoModel):
    class UniversityType(models.TextChoices):
        STATE = 'state', 'Государственный'
        PRIVATE = 'private', 'Частный'
        OTHER = 'other', 'Другое'

    country = models.ForeignKey(
        Country,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='universities',
        verbose_name='Страна'
    )
    city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='universities',
        verbose_name='Город'
    )
    name = models.CharField('Название университета', max_length=255)
    slug = models.SlugField('Slug', max_length=255, unique=True, blank=True)
    logo = models.ImageField('Логотип', upload_to='universities/logos/', blank=True, null=True)
    cover_image = models.ImageField('Обложка', upload_to='universities/covers/', blank=True, null=True)
    description_markdown = models.TextField('Описание Markdown', blank=True)
    university_type = models.CharField(
        'Тип университета',
        max_length=50,
        choices=UniversityType.choices,
        default=UniversityType.STATE
    )
    partner_status = models.BooleanField('Партнёр Student’s Life', default=False)
    recognized_status = models.BooleanField('Признаваемый вуз', default=False)
    official_website = models.URLField('Официальный сайт', blank=True)
    languages = models.CharField('Языки обучения', max_length=255, blank=True)
    education_levels = models.CharField('Уровни обучения', max_length=255, blank=True)
    has_dormitory = models.BooleanField('Есть общежитие', default=False)
    dormitory_cost = models.CharField('Стоимость общежития', max_length=255, blank=True)
    scholarship_available = models.BooleanField('Есть стипендии', default=False)
    tuition_from = models.CharField('Стоимость обучения от', max_length=255, blank=True)
    application_deadline = models.CharField('Сроки подачи', max_length=255, blank=True)
    required_documents = models.TextField('Необходимые документы', blank=True)

    class Meta:
        verbose_name = 'Университет'
        verbose_name_plural = 'Университеты'
        ordering = ['sort_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Program(TimeStampedModel, SortableModel):
    class Level(models.TextChoices):
        FOUNDATION = 'foundation', 'Подкурс / Foundation'
        BACHELOR = 'bachelor', 'Бакалавриат'
        MASTER = 'master', 'Магистратура'
        PHD = 'phd', 'Аспирантура / PhD'
        LANGUAGE = 'language', 'Языковые курсы'
        OTHER = 'other', 'Другое'

    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='programs',
        verbose_name='Университет'
    )
    title = models.CharField('Название программы', max_length=255)
    level = models.CharField('Уровень', max_length=50, choices=Level.choices)
    faculty = models.CharField('Факультет', max_length=255, blank=True)
    specialty = models.CharField('Специальность', max_length=255, blank=True)
    language = models.CharField('Язык обучения', max_length=100, blank=True)
    duration = models.CharField('Срок обучения', max_length=100, blank=True)
    tuition_fee = models.DecimalField('Стоимость обучения', max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField('Валюта', max_length=20, default='USD')
    application_deadline = models.CharField('Дедлайн подачи', max_length=255, blank=True)
    start_date = models.CharField('Начало обучения', max_length=255, blank=True)
    required_documents = models.TextField('Необходимые документы', blank=True)
    requirements = models.TextField('Требования', blank=True)

    class Meta:
        verbose_name = 'Программа обучения'
        verbose_name_plural = 'Программы обучения'
        ordering = ['university__name', 'sort_order', 'title']

    def __str__(self):
        return f'{self.title} — {self.university.name}'

class FavoriteUniversity(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_universities',
        verbose_name='Пользователь'
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name='Университет'
    )

    class Meta:
        verbose_name = 'Избранный университет'
        verbose_name_plural = 'Избранные университеты'
        unique_together = ['user', 'university']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} — {self.university}'