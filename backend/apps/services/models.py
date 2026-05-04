from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel, SortableModel, SeoModel


class Service(TimeStampedModel, SortableModel, SeoModel):
    title = models.CharField('Название услуги', max_length=255)
    slug = models.SlugField('Slug', max_length=255, unique=True, blank=True)
    short_description = models.CharField('Краткое описание', max_length=500, blank=True)
    description_markdown = models.TextField('Полное описание Markdown', blank=True)
    icon = models.ImageField('Иконка', upload_to='services/icons/', blank=True, null=True)
    cover_image = models.ImageField('Обложка', upload_to='services/covers/', blank=True, null=True)
    required_documents = models.TextField('Необходимые документы', blank=True)
    estimated_time = models.CharField('Примерные сроки', max_length=255, blank=True)
    button_text = models.CharField('Текст кнопки', max_length=100, default='Подать заявку')

    class Meta:
        verbose_name = 'Услуга'
        verbose_name_plural = 'Услуги'
        ordering = ['sort_order', 'title']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title