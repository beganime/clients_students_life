from django.db import migrations


MANAGER_ONLY_TYPES = (
    'Перевод заграничного паспорта',
    'Перевод документа об образовании',
)


def hide_manager_only_types(apps, schema_editor):
    RequiredDocumentType = apps.get_model('documents', 'RequiredDocumentType')
    RequiredDocumentType.objects.filter(title__in=MANAGER_ONLY_TYPES).update(is_active=False)


class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0003_disk_storage_and_standard_types'),
    ]

    operations = [
        migrations.RunPython(hide_manager_only_types, migrations.RunPython.noop),
    ]
