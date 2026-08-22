from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0003_backfill_client_profiles')]

    operations = [
        migrations.AddField(
            model_name='clientprofile', name='onboarding_public_id',
            field=models.CharField(blank=True, max_length=64, verbose_name='ID анкеты ManagerSL'),
        ),
        migrations.AddField(
            model_name='clientprofile', name='onboarding_access_token',
            field=models.CharField(blank=True, max_length=255, verbose_name='Токен анкеты ManagerSL'),
        ),
        migrations.AddField(
            model_name='clientprofile', name='onboarding_kind',
            field=models.CharField(blank=True, default='applicant', max_length=24, verbose_name='Тип анкеты ManagerSL'),
        ),
    ]
