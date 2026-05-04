from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.common.models import TimeStampedModel, SeoModel
from apps.staff.models import StaffProfile


class KnowledgeCategory(TimeStampedModel):
    title = models.CharField('Название категории', max_length=255)
    slug = models.SlugField('Slug', max_length=255, unique=True, blank=True)

    class Meta:
        verbose_name = 'Категория базы знаний'
        verbose_name_plural = 'Категории базы знаний'
        ordering = ['title']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class KnowledgeArticle(TimeStampedModel, SeoModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        PUBLISHED = 'published', 'Опубликовано'
        HIDDEN = 'hidden', 'Скрыто'

    title = models.CharField('Заголовок', max_length=255)
    slug = models.SlugField('Slug', max_length=255, unique=True, blank=True)
    short_description = models.CharField('Краткое описание', max_length=500, blank=True)
    content_markdown = models.TextField('Текст Markdown', blank=True)
    cover_image = models.ImageField('Обложка', upload_to='knowledge/covers/', blank=True, null=True)
    category = models.ForeignKey(
        KnowledgeCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles',
        verbose_name='Категория'
    )
    author_staff = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='knowledge_articles',
        verbose_name='Автор'
    )
    tags = models.CharField('Теги', max_length=500, blank=True)
    status = models.CharField('Статус', max_length=20, choices=Status.choices, default=Status.DRAFT)
    published_at = models.DateTimeField('Дата публикации', null=True, blank=True)

    class Meta:
        verbose_name = 'Статья базы знаний'
        verbose_name_plural = 'База знаний'
        ordering = ['-published_at', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title