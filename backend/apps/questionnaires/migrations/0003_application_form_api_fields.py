# Generated manually for Student's Life application form API.

import apps.questionnaires.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questionnaires', '0002_questionnaire_completed_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='applicantquestionnaire',
            name='form_type',
            field=models.CharField(
                choices=[
                    ('school_student', 'Школьник / предварительная заявка'),
                    ('applicant', 'Абитуриент / полная анкета'),
                ],
                db_index=True,
                default='applicant',
                max_length=32,
                verbose_name='Тип заявки',
            ),
        ),
        migrations.AddField(
            model_name='applicantquestionnaire',
            name='generated_document',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=apps.questionnaires.models.questionnaire_document_upload_to,
                verbose_name='Сгенерированный документ анкеты',
            ),
        ),
        migrations.AddField(
            model_name='applicantquestionnaire',
            name='generated_document_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Дата генерации документа'),
        ),
        migrations.AlterField(
            model_name='applicantquestionnaire',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Черновик'),
                    ('completed', 'Заполнена'),
                    ('submitted', 'Отправлена на проверку'),
                    ('approved', 'Принята'),
                    ('rejected', 'Отклонена'),
                    ('updated', 'Обновлена'),
                ],
                default='draft',
                max_length=20,
                verbose_name='Статус анкеты',
            ),
        ),
    ]
