from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        abstract = True


class SortableModel(models.Model):
    sort_order = models.PositiveIntegerField('Порядок сортировки', default=0)
    is_active = models.BooleanField('Активно', default=True)

    class Meta:
        abstract = True


class SeoModel(models.Model):
    meta_title = models.CharField('SEO заголовок', max_length=255, blank=True)
    meta_description = models.TextField('SEO описание', blank=True)

    class Meta:
        abstract = True


class AppSetting(TimeStampedModel):
    key = models.CharField('Ключ', max_length=100, unique=True)
    value = models.TextField('Значение', blank=True)
    description = models.TextField('Описание', blank=True)

    class Meta:
        verbose_name = 'Настройка приложения'
        verbose_name_plural = 'Настройки приложения'
        ordering = ['key']

    def __str__(self):
        return self.key