from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0005_clientprofile_current_location')]

    operations = [
        migrations.AddField(
            model_name='clientprofile',
            name='onboarding_activated_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Аккаунт активирован'),
        ),
    ]
