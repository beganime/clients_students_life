from django.db import migrations, models


STANDARD_DOCUMENT_TYPES = (
    ('Заграничный паспорт', 'Основной разворот действующего заграничного паспорта.', True, False, 'Личные документы'),
    ('Перевод заграничного паспорта', 'Подтверждённый перевод паспорта. Можно загрузить после подготовки менеджером.', False, True, 'Переводы'),
    ('Аттестат или диплом', 'Документ о последнем завершённом образовании.', True, False, 'Образование'),
    ('Приложение с оценками', 'Приложение к аттестату или диплому со всеми оценками.', True, False, 'Образование'),
    ('Перевод документа об образовании', 'Подтверждённый перевод аттестата, диплома и приложения.', False, True, 'Переводы'),
    ('Фотография 3×4', 'Цветная фотография на светлом фоне.', True, False, 'Личные документы'),
    ('Медицинская справка', 'Медицинская справка, если она уже оформлена.', False, False, 'Медицина'),
    ('Сертификаты и достижения', 'Олимпиады, языковые сертификаты и другие достижения.', False, False, 'Достижения'),
)


def seed_standard_document_types(apps, schema_editor):
    RequiredDocumentType = apps.get_model('documents', 'RequiredDocumentType')
    for sort_order, (title, description, is_required, translation_required, category) in enumerate(
        STANDARD_DOCUMENT_TYPES,
        start=10,
    ):
        RequiredDocumentType.objects.update_or_create(
            title=title,
            service=None,
            country=None,
            defaults={
                'description': description,
                'is_required': is_required,
                'translation_required': translation_required,
                'category': category,
                'sort_order': sort_order,
                'is_active': True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0002_userdocument_reviewed_by_email_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userdocument',
            name='disk_folder_url',
            field=models.URLField(blank=True, max_length=1000, verbose_name='DiskSL manager folder URL'),
        ),
        migrations.AddField(
            model_name='userdocument',
            name='disk_path',
            field=models.CharField(blank=True, max_length=1000, verbose_name='DiskSL path'),
        ),
        migrations.RunPython(seed_standard_document_types, migrations.RunPython.noop),
    ]
