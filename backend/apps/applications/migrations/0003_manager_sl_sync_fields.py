from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0002_applicationstatushistory'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='target_country_external_id',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='manager-sl country ID'),
        ),
        migrations.AddField(
            model_name='application',
            name='target_city_external_id',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='manager-sl city ID'),
        ),
        migrations.AddField(
            model_name='application',
            name='target_university_external_id',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='manager-sl university ID'),
        ),
        migrations.AddField(
            model_name='application',
            name='target_program_external_id',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='manager-sl program ID'),
        ),
        migrations.AddField(
            model_name='application',
            name='target_country_snapshot',
            field=models.CharField(blank=True, max_length=255, verbose_name='Target country snapshot'),
        ),
        migrations.AddField(
            model_name='application',
            name='target_city_snapshot',
            field=models.CharField(blank=True, max_length=255, verbose_name='Target city snapshot'),
        ),
        migrations.AddField(
            model_name='application',
            name='target_university_snapshot',
            field=models.CharField(blank=True, max_length=255, verbose_name='Target university snapshot'),
        ),
        migrations.AddField(
            model_name='application',
            name='target_program_snapshot',
            field=models.CharField(blank=True, max_length=255, verbose_name='Target program snapshot'),
        ),
        migrations.AddField(
            model_name='application',
            name='manager_sl_application_id',
            field=models.CharField(blank=True, max_length=100, verbose_name='manager-sl application ID'),
        ),
        migrations.AddField(
            model_name='application',
            name='manager_sl_sync_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')], default='pending', max_length=20, verbose_name='manager-sl sync status'),
        ),
        migrations.AddField(
            model_name='application',
            name='manager_sl_sync_error',
            field=models.TextField(blank=True, verbose_name='manager-sl sync error'),
        ),
        migrations.AddField(
            model_name='application',
            name='manager_sl_payload',
            field=models.JSONField(blank=True, default=dict, verbose_name='manager-sl payload'),
        ),
        migrations.AddField(
            model_name='application',
            name='idempotency_key',
            field=models.CharField(blank=True, max_length=120, null=True, unique=True, verbose_name='Idempotency key'),
        ),
        migrations.AddField(
            model_name='application',
            name='synced_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Synced at'),
        ),
    ]
