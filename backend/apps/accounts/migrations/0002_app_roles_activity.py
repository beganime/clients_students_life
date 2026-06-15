import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_roles(apps, schema_editor):
    AppRole = apps.get_model('accounts', 'AppRole')
    ClientProfile = apps.get_model('accounts', 'ClientProfile')
    user_role, _ = AppRole.objects.get_or_create(
        code='user',
        defaults={
            'name': 'User',
            'description': 'Default mobile application user role.',
            'is_manager': False,
        },
    )
    AppRole.objects.get_or_create(
        code='manager',
        defaults={
            'name': 'Manager',
            'description': 'Mobile manager role with access to client requests and chats.',
            'is_manager': True,
        },
    )
    ClientProfile.objects.filter(role__isnull=True).update(role=user_role)


def unseed_roles(apps, schema_editor):
    AppRole = apps.get_model('accounts', 'AppRole')
    ClientProfile = apps.get_model('accounts', 'ClientProfile')
    ClientProfile.objects.filter(role__code__in=['user', 'manager']).update(role=None)
    AppRole.objects.filter(code__in=['user', 'manager']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AppRole',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ')),
                ('code', models.SlugField(max_length=50, unique=True, verbose_name='Code')),
                ('name', models.CharField(max_length=120, verbose_name='Name')),
                ('description', models.TextField(blank=True, verbose_name='Description')),
                ('is_manager', models.BooleanField(default=False, verbose_name='Manager access')),
            ],
            options={
                'verbose_name': 'App role',
                'verbose_name_plural': 'App roles',
                'ordering': ['code'],
            },
        ),
        migrations.CreateModel(
            name='AppUserActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ')),
                ('is_online', models.BooleanField(default=False, verbose_name='Online')),
                ('last_seen', models.DateTimeField(blank=True, null=True, verbose_name='Last seen')),
                ('last_active_at', models.DateTimeField(blank=True, null=True, verbose_name='Last active at')),
                ('device_platform', models.CharField(blank=True, max_length=40, verbose_name='Device platform')),
                ('device_id', models.CharField(blank=True, max_length=255, verbose_name='Device ID')),
                ('app_version', models.CharField(blank=True, max_length=80, verbose_name='App version')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='app_activity', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'App user activity',
                'verbose_name_plural': 'App user activities',
                'ordering': ['-last_active_at', '-last_seen'],
            },
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='role',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='profiles', to='accounts.approle', verbose_name='App role'),
        ),
        migrations.RunPython(seed_roles, unseed_roles),
    ]
