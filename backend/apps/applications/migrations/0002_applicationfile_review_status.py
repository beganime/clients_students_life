# Generated manually for manager-sl document review synchronization.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='applicationfile',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'На проверке'),
                    ('approved', 'Принят'),
                    ('rejected', 'Не принят'),
                ],
                db_index=True,
                default='pending',
                max_length=20,
                verbose_name='Статус проверки',
            ),
        ),
        migrations.AddField(
            model_name='applicationfile',
            name='admin_comment',
            field=models.TextField(blank=True, verbose_name='Комментарий менеджера'),
        ),
        migrations.AddField(
            model_name='applicationfile',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Дата проверки'),
        ),
    ]
