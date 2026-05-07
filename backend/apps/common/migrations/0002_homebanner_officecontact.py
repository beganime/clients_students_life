# Generated manually for home banners and office contacts

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0001_initial'),
        ('news', '0001_initial'),
        ('services', '0001_initial'),
        ('universities', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='OfficeContact',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активно')),
                ('country', models.CharField(blank=True, max_length=120, verbose_name='Страна')),
                ('city', models.CharField(max_length=120, verbose_name='Город')),
                ('office_name', models.CharField(blank=True, max_length=255, verbose_name='Название офиса')),
                ('address', models.TextField(blank=True, verbose_name='Адрес')),
                ('phone', models.CharField(blank=True, max_length=100, verbose_name='Телефон')),
                ('whatsapp', models.CharField(blank=True, max_length=100, verbose_name='WhatsApp')),
                ('telegram', models.CharField(blank=True, max_length=100, verbose_name='Telegram')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='Email')),
                ('instagram', models.URLField(blank=True, verbose_name='Instagram')),
                ('tiktok', models.URLField(blank=True, verbose_name='TikTok')),
                ('website', models.URLField(blank=True, verbose_name='Сайт')),
                ('map_url', models.URLField(blank=True, verbose_name='Ссылка на карту')),
                ('work_hours', models.CharField(blank=True, max_length=255, verbose_name='График работы')),
                ('note', models.TextField(blank=True, verbose_name='Примечание')),
            ],
            options={
                'verbose_name': 'Офис / контакт',
                'verbose_name_plural': 'Офисы и контакты',
                'ordering': ['sort_order', 'country', 'city'],
            },
        ),
        migrations.CreateModel(
            name='HomeBanner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активно')),
                ('slot', models.CharField(choices=[('hero', 'Главный верхний баннер'), ('news', 'Нижний баннер / новости')], default='hero', max_length=20, verbose_name='Место показа')),
                ('title', models.CharField(max_length=255, verbose_name='Заголовок')),
                ('subtitle', models.CharField(blank=True, max_length=500, verbose_name='Подзаголовок')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('badge', models.CharField(blank=True, max_length=100, verbose_name='Метка')),
                ('image', models.ImageField(blank=True, null=True, upload_to='home/banners/', verbose_name='Изображение')),
                ('cta_text', models.CharField(blank=True, default='Подробнее', max_length=100, verbose_name='Текст кнопки')),
                ('cta_type', models.CharField(choices=[('none', 'Без действия'), ('url', 'Внешняя ссылка'), ('application', 'Открыть заявку'), ('universities', 'Открыть раздел Вузы'), ('news', 'Открыть новость'), ('service', 'Открыть услугу'), ('university', 'Открыть университет')], default='none', max_length=30, verbose_name='Действие кнопки')),
                ('cta_url', models.URLField(blank=True, verbose_name='Внешняя ссылка')),
                ('background_gradient', models.CharField(blank=True, default='#E53935,#1565C0', help_text='Например: #E53935,#1565C0', max_length=255, verbose_name='Градиент / цвет фона')),
                ('is_dark', models.BooleanField(default=True, verbose_name='Тёмный фон')),
                ('linked_news', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='home_banners', to='news.newspost', verbose_name='Связанная новость')),
                ('linked_service', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='home_banners', to='services.service', verbose_name='Связанная услуга')),
                ('linked_university', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='home_banners', to='universities.university', verbose_name='Связанный вуз')),
            ],
            options={
                'verbose_name': 'Баннер главной',
                'verbose_name_plural': 'Баннеры главной',
                'ordering': ['slot', 'sort_order', '-created_at'],
            },
        ),
    ]