from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def attach_placeholder_users(apps, schema_editor):
    StaffProfile = apps.get_model('staff', 'StaffProfile')
    user_app_label, user_model_name = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(user_app_label, user_model_name)

    for staff in StaffProfile.objects.filter(user__isnull=True):
        base_username = f'staff-profile-{staff.pk}@placeholder.local'
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            counter += 1
            username = f'staff-profile-{staff.pk}-{counter}@placeholder.local'

        user = User(
            username=username,
            email='',
            first_name=(staff.full_name or '').split(' ')[0][:150],
            last_name=' '.join((staff.full_name or '').split(' ')[1:])[:150],
            is_active=False,
        )
        user.set_unusable_password()
        user.save()
        staff.user = user
        staff.save(update_fields=['user'])


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(attach_placeholder_users, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='staffprofile',
            name='user',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='staff_profile',
                to=settings.AUTH_USER_MODEL,
                verbose_name='РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ',
            ),
        ),
    ]
