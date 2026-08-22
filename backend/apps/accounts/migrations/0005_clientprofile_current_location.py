from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0004_clientprofile_onboarding_access')]

    operations = [
        migrations.AddField(
            model_name='clientprofile', name='current_location',
            field=models.CharField(blank=True, max_length=255, verbose_name='Где находится сейчас'),
        ),
        migrations.AddField(
            model_name='clientprofile', name='location_updated_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Местоположение обновлено'),
        ),
    ]
