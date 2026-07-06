from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import apps.documents.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('locations', '0001_initial'),
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RequiredDocumentType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активно')),
                ('title', models.CharField(max_length=255, verbose_name='Название документа')),
                ('description', models.TextField(blank=True, verbose_name='Описание / подсказка')),
                ('is_required', models.BooleanField(default=True, verbose_name='Обязательный')),
                ('translation_required', models.BooleanField(default=False, verbose_name='Нужен перевод')),
                ('category', models.CharField(blank=True, max_length=120, verbose_name='Категория')),
                ('country', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='required_document_types', to='locations.country', verbose_name='Страна / направление')),
                ('service', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='required_document_types', to='services.service', verbose_name='Услуга')),
            ],
            options={
                'verbose_name': 'Тип документа клиента',
                'verbose_name_plural': 'Типы документов клиентов',
                'ordering': ['sort_order', 'title'],
            },
        ),
        migrations.CreateModel(
            name='UserDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('file', models.FileField(blank=True, null=True, upload_to=apps.documents.models.user_document_upload_to, verbose_name='Файл')),
                ('original_name', models.CharField(blank=True, max_length=255, verbose_name='Оригинальное имя файла')),
                ('has_translation', models.BooleanField(default=False, verbose_name='Есть перевод')),
                ('status', models.CharField(choices=[('not_uploaded', 'Не загружен'), ('pending', 'Отправлен на проверку'), ('approved', 'Принят'), ('rejected', 'Не принят')], default='not_uploaded', max_length=30, verbose_name='Статус')),
                ('admin_comment', models.TextField(blank=True, verbose_name='Комментарий менеджера')),
                ('uploaded_at', models.DateTimeField(blank=True, null=True, verbose_name='Дата загрузки')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True, verbose_name='Дата проверки')),
                ('manager_sl_document_id', models.CharField(blank=True, max_length=100, verbose_name='Manager SL document ID')),
                ('manager_sl_sync_status', models.CharField(choices=[('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')], default='pending', max_length=20, verbose_name='Manager SL sync status')),
                ('manager_sl_sync_error', models.TextField(blank=True, verbose_name='Manager SL sync error')),
                ('document_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='user_documents', to='documents.requireddocumenttype', verbose_name='Тип документа')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_user_documents', to=settings.AUTH_USER_MODEL, verbose_name='Проверил')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Документ клиента',
                'verbose_name_plural': 'Документы клиентов',
                'ordering': ['document_type__sort_order', 'document_type__title'],
            },
        ),
        migrations.AddConstraint(
            model_name='userdocument',
            constraint=models.UniqueConstraint(fields=('user', 'document_type'), name='unique_user_document_type'),
        ),
    ]
