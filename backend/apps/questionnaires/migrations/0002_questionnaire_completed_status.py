from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questionnaires', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='applicantquestionnaire',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Не заполнена'),
                    ('completed', 'Заполнена'),
                    ('submitted', 'Заполнена'),
                    ('updated', 'Обновлена'),
                ],
                default='draft',
                max_length=20,
                verbose_name='Статус анкеты',
            ),
        ),
    ]
