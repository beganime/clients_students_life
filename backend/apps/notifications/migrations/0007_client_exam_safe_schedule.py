from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('notifications', '0006_unique_client_external_exam')]

    operations = [
        migrations.AddField(
            model_name='clientexam',
            name='university',
            field=models.CharField(default='Экзамен', max_length=255, verbose_name='Вуз'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='clientexam',
            name='creation_notified_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Уведомление о добавлении'),
        ),
        migrations.AddField(
            model_name='clientexam',
            name='day_before_notified_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Уведомление за день'),
        ),
        migrations.AddField(
            model_name='clientexam',
            name='exam_day_notified_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Уведомление в день экзамена'),
        ),
    ]
