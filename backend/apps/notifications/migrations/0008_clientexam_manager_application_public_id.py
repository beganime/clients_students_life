from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('notifications', '0007_client_exam_safe_schedule')]

    operations = [
        migrations.AddField(
            model_name='clientexam', name='manager_application_public_id',
            field=models.CharField(blank=True, db_index=True, max_length=36, verbose_name='Manager SL application ID'),
        ),
    ]
