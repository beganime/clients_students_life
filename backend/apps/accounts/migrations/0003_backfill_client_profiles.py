from django.conf import settings
from django.db import migrations


def backfill_client_profiles(apps, schema_editor):
    AppRole = apps.get_model('accounts', 'AppRole')
    ClientProfile = apps.get_model('accounts', 'ClientProfile')
    user_app_label, user_model_name = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(user_app_label, user_model_name)

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

    existing_user_ids = set(ClientProfile.objects.values_list('user_id', flat=True))
    for user in User.objects.exclude(id__in=existing_user_ids).iterator():
        ClientProfile.objects.get_or_create(
            user=user,
            defaults={'role': user_role},
        )
    ClientProfile.objects.filter(role__isnull=True).update(role=user_role)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_app_roles_activity'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(backfill_client_profiles, migrations.RunPython.noop),
    ]
