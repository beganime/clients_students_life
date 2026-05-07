from django.db import models


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


class HomeBanner(TimeStampedModel, SortableModel):
    class Slot(models.TextChoices):
        HERO = 'hero', 'Главный верхний баннер'
        NEWS = 'news', 'Нижний баннер / новости'

    class CtaType(models.TextChoices):
        NONE = 'none', 'Без действия'
        URL = 'url', 'Внешняя ссылка'
        APPLICATION = 'application', 'Открыть заявку'
        UNIVERSITIES = 'universities', 'Открыть раздел Вузы'
        NEWS = 'news', 'Открыть новость'
        SERVICE = 'service', 'Открыть услугу'
        UNIVERSITY = 'university', 'Открыть университет'

    slot = models.CharField(
        'Место показа',
        max_length=20,
        choices=Slot.choices,
        default=Slot.HERO,
    )
    title = models.CharField('Заголовок', max_length=255)
    subtitle = models.CharField('Подзаголовок', max_length=500, blank=True)
    description = models.TextField('Описание', blank=True)
    badge = models.CharField('Метка', max_length=100, blank=True)
    image = models.ImageField('Изображение', upload_to='home/banners/', blank=True, null=True)

    cta_text = models.CharField('Текст кнопки', max_length=100, blank=True, default='Подробнее')
    cta_type = models.CharField(
        'Действие кнопки',
        max_length=30,
        choices=CtaType.choices,
        default=CtaType.NONE,
    )
    cta_url = models.URLField('Внешняя ссылка', blank=True)

    linked_news = models.ForeignKey(
        'news.NewsPost',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='home_banners',
        verbose_name='Связанная новость',
    )
    linked_service = models.ForeignKey(
        'services.Service',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='home_banners',
        verbose_name='Связанная услуга',
    )
    linked_university = models.ForeignKey(
        'universities.University',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='home_banners',
        verbose_name='Связанный вуз',
    )

    background_gradient = models.CharField(
        'Градиент / цвет фона',
        max_length=255,
        blank=True,
        default='#E53935,#1565C0',
        help_text='Например: #E53935,#1565C0',
    )
    is_dark = models.BooleanField('Тёмный фон', default=True)

    class Meta:
        verbose_name = 'Баннер главной'
        verbose_name_plural = 'Баннеры главной'
        ordering = ['slot', 'sort_order', '-created_at']

    def __str__(self):
        return f'{self.get_slot_display()} — {self.title}'


class OfficeContact(TimeStampedModel, SortableModel):
    country = models.CharField('Страна', max_length=120, blank=True)
    city = models.CharField('Город', max_length=120)
    office_name = models.CharField('Название офиса', max_length=255, blank=True)
    address = models.TextField('Адрес', blank=True)

    phone = models.CharField('Телефон', max_length=100, blank=True)
    whatsapp = models.CharField('WhatsApp', max_length=100, blank=True)
    telegram = models.CharField('Telegram', max_length=100, blank=True)
    email = models.EmailField('Email', blank=True)

    instagram = models.URLField('Instagram', blank=True)
    tiktok = models.URLField('TikTok', blank=True)
    website = models.URLField('Сайт', blank=True)
    map_url = models.URLField('Ссылка на карту', blank=True)

    work_hours = models.CharField('График работы', max_length=255, blank=True)
    note = models.TextField('Примечание', blank=True)

    class Meta:
        verbose_name = 'Офис / контакт'
        verbose_name_plural = 'Офисы и контакты'
        ordering = ['sort_order', 'country', 'city']

    def __str__(self):
        return f'{self.city} — {self.office_name or self.phone or self.email}'