from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0005_alter_clientexam_options_clientexam_target_devices_and_more'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='clientexam',
            constraint=models.UniqueConstraint(
                fields=('user', 'manager_sl_exam_id'),
                condition=~models.Q(manager_sl_exam_id=''),
                name='unique_client_external_exam',
            ),
        ),
    ]
