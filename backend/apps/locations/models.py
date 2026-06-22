from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel, SortableModel, SeoModel


class Country(TimeStampedModel, SortableModel, SeoModel):
    name = models.CharField('Название страны', max_length=255)
    slug = models.SlugField('Slug', max_length=255, unique=True, blank=True)
    flag = models.ImageField('Флаг', upload_to='countries/flags/', blank=True, null=True)
    cover_image = models.ImageField('Обложка', upload_to='countries/covers/', blank=True, null=True)
    short_description = models.CharField('Краткое описание', max_length=500, blank=True)
    description_markdown = models.TextField('Описание Markdown', blank=True)
    visa_info = models.TextField('Информация о визе', blank=True)
    work_info = models.TextField('Работа во время учёбы', blank=True)
    average_tuition = models.CharField('Средняя стоимость обучения', max_length=255, blank=True)
    average_living_cost = models.CharField('Средняя стоимость жизни', max_length=255, blank=True)

    class Meta:
        verbose_name = 'Страна'
        verbose_name_plural = 'Страны'
        ordering = ['sort_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class City(TimeStampedModel, SortableModel, SeoModel):
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        related_name='cities',
        verbose_name='Страна'
    )
    name = models.CharField('Название города', max_length=255)
    slug = models.SlugField('Slug', max_length=255, blank=True)
    image = models.ImageField('Фото города', upload_to='cities/', blank=True, null=True)
    description_markdown = models.TextField('Описание Markdown', blank=True)
    rent_cost = models.CharField('Аренда / жильё', max_length=255, blank=True)
    food_cost = models.CharField('Питание', max_length=255, blank=True)
    transport_cost = models.CharField('Транспорт', max_length=255, blank=True)
    total_monthly_cost = models.CharField('Итого в месяц', max_length=255, blank=True)

    class Meta:
        verbose_name = 'Город'
        verbose_name_plural = 'Города'
        ordering = ['country__name', 'sort_order', 'name']
        unique_together = ['country', 'slug']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name}, {self.country.name}'


class Office(TimeStampedModel, SortableModel):
    country = models.ForeignKey(
        Country,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='offices',
        verbose_name='Страна'
    )
    city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='offices',
        verbose_name='Город'
    )
    title = models.CharField('Название офиса', max_length=255)
    address = models.TextField('Адрес', blank=True)
    phone = models.CharField('Телефон', max_length=100, blank=True)
    whatsapp = models.CharField('WhatsApp', max_length=100, blank=True)
    telegram = models.CharField('Telegram', max_length=100, blank=True)
    email = models.EmailField('Email', blank=True)
    imo = models.CharField('IMO', max_length=100, blank=True)
    instagram = models.URLField('Instagram', blank=True)
    tiktok = models.URLField('TikTok', blank=True)
    website = models.URLField('Website', blank=True)
    map_url = models.URLField('Map URL', blank=True)
    work_time = models.CharField('Время работы', max_length=255, blank=True)
    latitude = models.DecimalField('Широта', max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField('Долгота', max_digits=10, decimal_places=7, null=True, blank=True)
    image = models.ImageField('Фото офиса', upload_to='offices/', blank=True, null=True)

    class Meta:
        verbose_name = 'Офис'
        verbose_name_plural = 'Офисы'
        ordering = ['sort_order', 'title']

    def __str__(self):
        return self.title
