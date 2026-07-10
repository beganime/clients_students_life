# Generated manually for the public developer order page.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0003_privacypolicy'),
    ]

    operations = [
        migrations.CreateModel(
            name='DeveloperRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('name', models.CharField(max_length=160, verbose_name='Имя')),
                ('contact', models.CharField(max_length=180, verbose_name='Контакт')),
                ('contact_method', models.CharField(blank=True, default='telegram', max_length=40, verbose_name='Способ связи')),
                ('project_type', models.CharField(choices=[
                    ('website', 'Сайт'),
                    ('mobile_app', 'Мобильное приложение'),
                    ('crm_erp', 'CRM / ERP / HRM'),
                    ('bot_integration', 'Telegram bot / Google Sheets'),
                    ('server_deploy', 'Сервер / домен / деплой'),
                    ('other', 'Другое'),
                ], default='website', max_length=40, verbose_name='Тип проекта')),
                ('budget', models.CharField(blank=True, max_length=120, verbose_name='Бюджет')),
                ('timeline', models.CharField(blank=True, max_length=120, verbose_name='Сроки')),
                ('message', models.TextField(verbose_name='Описание задачи')),
                ('status', models.CharField(choices=[
                    ('new', 'Новая'),
                    ('in_progress', 'В работе'),
                    ('contacted', 'Связались'),
                    ('closed', 'Закрыта'),
                ], default='new', max_length=30, verbose_name='Статус')),
                ('source_path', models.CharField(blank=True, default='/developer/', max_length=255, verbose_name='Источник')),
                ('user_agent', models.TextField(blank=True, verbose_name='User agent')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP адрес')),
            ],
            options={
                'verbose_name': 'Заявка на разработку',
                'verbose_name_plural': 'Заявки на разработку',
                'ordering': ['-created_at'],
            },
        ),
    ]
