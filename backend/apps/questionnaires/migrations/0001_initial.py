# Generated manually for Student's Life questionnaire workflow.

import apps.questionnaires.models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ApplicantQuestionnaire',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('status', models.CharField(choices=[('draft', 'Не заполнена'), ('submitted', 'Заполнена'), ('updated', 'Обновлена')], default='draft', max_length=20, verbose_name='Статус анкеты')),
                ('full_name', models.CharField(blank=True, max_length=255, verbose_name='Полное ФИО')),
                ('birth_date', models.DateField(blank=True, null=True, verbose_name='Дата рождения')),
                ('gender', models.CharField(blank=True, choices=[('male', 'Мужской'), ('female', 'Женский')], max_length=20, verbose_name='Пол')),
                ('citizenship', models.CharField(blank=True, max_length=120, verbose_name='Гражданство')),
                ('marital_status', models.CharField(blank=True, max_length=120, verbose_name='Семейное положение')),
                ('face_photo', models.ImageField(blank=True, null=True, upload_to=apps.questionnaires.models.questionnaire_photo_upload_to, verbose_name='Фотография лица')),
                ('residence_country', models.CharField(blank=True, max_length=120, verbose_name='Страна проживания')),
                ('residence_region', models.CharField(blank=True, max_length=160, verbose_name='Область / регион')),
                ('residence_city', models.CharField(blank=True, max_length=160, verbose_name='Город / населенный пункт')),
                ('residence_street', models.CharField(blank=True, max_length=180, verbose_name='Улица')),
                ('residence_house', models.CharField(blank=True, max_length=80, verbose_name='Дом / квартира')),
                ('residence_postal_code', models.CharField(blank=True, max_length=40, verbose_name='Почтовый индекс')),
                ('passport_number', models.CharField(blank=True, max_length=120, verbose_name='Паспорт серия и номер')),
                ('passport_issued_by', models.CharField(blank=True, max_length=255, verbose_name='Где оформлен паспорт')),
                ('passport_issue_date', models.DateField(blank=True, null=True, verbose_name='Дата начала действия паспорта')),
                ('passport_expiry_date', models.DateField(blank=True, null=True, verbose_name='Дата окончания действия паспорта')),
                ('phone', models.CharField(blank=True, max_length=80, verbose_name='Основной номер телефона')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='Email')),
                ('extra_phone', models.CharField(blank=True, max_length=80, verbose_name='Дополнительный номер телефона')),
                ('imo', models.CharField(blank=True, max_length=120, verbose_name='Imo')),
                ('telegram', models.CharField(blank=True, max_length=120, verbose_name='Telegram')),
                ('preferred_contact_method', models.CharField(blank=True, max_length=40, verbose_name='Предпочтительный способ связи')),
                ('parent_full_name', models.CharField(blank=True, max_length=255, verbose_name='ФИО родителя')),
                ('parent_relation', models.CharField(blank=True, max_length=120, verbose_name='Кем является')),
                ('parent_contacts', models.CharField(blank=True, max_length=180, verbose_name='Контакты родителя')),
                ('parent_workplace', models.CharField(blank=True, max_length=255, verbose_name='Кем и где работает родитель')),
                ('family_members', models.CharField(blank=True, max_length=120, verbose_name='В семье имеется')),
                ('education_level', models.CharField(blank=True, max_length=120, verbose_name='Уровень образования')),
                ('school_class', models.CharField(blank=True, max_length=40, verbose_name='Класс')),
                ('school_name', models.CharField(blank=True, max_length=255, verbose_name='Учебное заведение')),
                ('school_country', models.CharField(blank=True, max_length=120, verbose_name='Страна учебного заведения')),
                ('school_city', models.CharField(blank=True, max_length=120, verbose_name='Город учебного заведения')),
                ('graduation_year', models.CharField(blank=True, max_length=20, verbose_name='Год окончания')),
                ('education_status', models.CharField(blank=True, max_length=80, verbose_name='Статус обучения')),
                ('achievements', models.JSONField(blank=True, default=list, verbose_name='Достижения')),
                ('languages', models.JSONField(blank=True, default=list, verbose_name='Языки')),
                ('desired_program', models.CharField(blank=True, max_length=255, verbose_name='Желаемая программа / Вуз')),
                ('admission_goal', models.TextField(blank=True, verbose_name='Цель поступления')),
                ('desired_city', models.CharField(blank=True, max_length=120, verbose_name='Желаемый город поступления')),
                ('desired_country', models.CharField(blank=True, max_length=120, verbose_name='Желаемая страна поступления')),
                ('desired_language', models.CharField(blank=True, max_length=120, verbose_name='Желаемый язык обучения')),
                ('desired_education_level', models.CharField(blank=True, max_length=120, verbose_name='Желаемый уровень обучения')),
                ('admission_urgency', models.CharField(blank=True, max_length=80, verbose_name='Срочность поступления')),
                ('help_needed', models.JSONField(blank=True, default=list, verbose_name='Нужна помощь с')),
                ('has_visa', models.CharField(blank=True, max_length=60, verbose_name='Виза имеется или нет')),
                ('visa_country', models.CharField(blank=True, max_length=120, verbose_name='Страна оформления визы')),
                ('visa_city', models.CharField(blank=True, max_length=120, verbose_name='Город оформления визы')),
                ('visa_valid_until', models.DateField(blank=True, null=True, verbose_name='Срок действия визы')),
                ('has_international_passport', models.CharField(blank=True, max_length=80, verbose_name='Есть действующий загранпаспорт')),
                ('hobbies', models.TextField(blank=True, verbose_name='Любимые хобби')),
                ('applicant_comment', models.TextField(blank=True, verbose_name='Дополнительный комментарий от абитуриента')),
                ('referral_source', models.CharField(blank=True, max_length=120, verbose_name='Откуда узнали о Student’s Life')),
                ('data_processing_consent', models.BooleanField(default=False, verbose_name='Согласие на обработку данных')),
                ('submitted_at', models.DateTimeField(blank=True, null=True, verbose_name='Дата заполнения')),
                ('manager_sl_questionnaire_id', models.CharField(blank=True, max_length=100, verbose_name='Manager SL questionnaire ID')),
                ('manager_sl_document_url', models.URLField(blank=True, max_length=1000, verbose_name='Manager SL generated document URL')),
                ('manager_sl_sync_status', models.CharField(choices=[('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')], default='pending', max_length=20, verbose_name='Manager SL sync status')),
                ('manager_sl_sync_error', models.TextField(blank=True, verbose_name='Manager SL sync error')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='applicant_questionnaire', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Анкета абитуриента',
                'verbose_name_plural': 'Анкеты абитуриентов',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='QuestionnaireAttachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('file', models.FileField(upload_to=apps.questionnaires.models.questionnaire_attachment_upload_to, verbose_name='Файл')),
                ('original_name', models.CharField(blank=True, max_length=255, verbose_name='Оригинальное имя файла')),
                ('file_type', models.CharField(blank=True, max_length=100, verbose_name='Тип файла')),
                ('questionnaire', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='questionnaires.applicantquestionnaire', verbose_name='Анкета')),
            ],
            options={
                'verbose_name': 'Вложение анкеты',
                'verbose_name_plural': 'Вложения анкеты',
                'ordering': ['-created_at'],
            },
        ),
    ]
