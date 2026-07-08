import os
from io import BytesIO

from django.utils import timezone
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt

from .labels import questionnaire_field_label


TEMPLATE_PATH = os.path.join(
    os.path.dirname(__file__),
    'document_templates',
    'anketa_students_life_template_v2.docx',
)


SECTION_FIELDS = (
    (
        'Личные данные',
        (
            'full_name',
            'birth_date',
            'gender',
            'citizenship',
            'marital_status',
        ),
    ),
    (
        'Адрес проживания',
        (
            'residence_country',
            'residence_region',
            'residence_city',
            'residence_street',
            'residence_house',
            'residence_postal_code',
        ),
    ),
    (
        'Паспортные данные',
        (
            'passport_number',
            'passport_issued_by',
            'passport_issue_date',
            'passport_expiry_date',
            'has_international_passport',
        ),
    ),
    (
        'Контакты абитуриента',
        (
            'phone',
            'email',
            'extra_phone',
            'imo',
            'telegram',
            'preferred_contact_method',
        ),
    ),
    (
        'Родители / законные представители',
        (
            'parent_full_name',
            'parent_relation',
            'parent_contacts',
            'parent_workplace',
            'family_members',
        ),
    ),
    (
        'Образование',
        (
            'education_status',
            'education_level',
            'school_class',
            'school_name',
            'school_country',
            'school_city',
            'graduation_year',
        ),
    ),
    (
        'Достижения и дополнительные документы',
        (
            'achievements',
        ),
    ),
    (
        'Языки',
        (
            'languages',
        ),
    ),
    (
        'Поступление',
        (
            'desired_program',
            'admission_goal',
            'desired_country',
            'desired_city',
            'desired_language',
            'desired_education_level',
            'admission_urgency',
            'help_needed',
        ),
    ),
    (
        'Виза',
        (
            'has_visa',
            'visa_country',
            'visa_city',
            'visa_valid_until',
        ),
    ),
    (
        'Дополнительная информация',
        (
            'hobbies',
            'applicant_comment',
            'referral_source',
            'data_processing_consent',
        ),
    ),
)


SCHOOL_STUDENT_FIELDS = {
    'full_name',
    'birth_date',
    'citizenship',
    'residence_country',
    'residence_region',
    'residence_city',
    'phone',
    'email',
    'extra_phone',
    'imo',
    'telegram',
    'parent_full_name',
    'parent_contacts',
    'education_status',
    'school_class',
    'school_name',
    'school_country',
    'school_city',
    'graduation_year',
    'desired_program',
    'desired_country',
    'desired_city',
    'desired_language',
    'applicant_comment',
    'data_processing_consent',
}


VALUE_LABELS = {
    'male': 'Мужской',
    'female': 'Женский',
    'school_student': 'Школьник / предварительная заявка',
    'applicant': 'Абитуриент / полная анкета',
    'draft': 'Черновик',
    'submitted': 'Отправлена на проверку',
    'completed': 'Заполнена',
    'approved': 'Принята',
    'rejected': 'Отклонена',
    'updated': 'Обновлена',
    True: 'Да',
    False: 'Нет',
}


def generate_questionnaire_docx(questionnaire):
    document = _load_template()
    _clear_body(document)
    _setup_document(document)

    title = (
        'Предварительная заявка школьника'
        if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT
        else 'Анкета абитуриента'
    )
    _add_header(document, title)
    _add_meta_table(document, questionnaire)
    _add_face_photo(document, questionnaire)

    allowed_fields = SCHOOL_STUDENT_FIELDS if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT else None
    for section_title, fields in SECTION_FIELDS:
        section_values = [
            (field, _format_field_value(questionnaire, field))
            for field in fields
            if allowed_fields is None or field in allowed_fields
        ]
        if not section_values:
            continue
        _add_section(document, section_title, section_values)

    attachments = list(questionnaire.attachments.all()) if questionnaire.pk else []
    if attachments:
        _add_section(
            document,
            'Вложения анкеты',
            [
                (
                    attachment.original_name or f'Файл {index}',
                    attachment.file_type or 'Файл',
                )
                for index, attachment in enumerate(attachments, start=1)
            ],
        )

    output = BytesIO()
    document.save(output)
    return output.getvalue()


def _load_template():
    if os.path.exists(TEMPLATE_PATH):
        return Document(TEMPLATE_PATH)
    return Document()


def _clear_body(document):
    body = document._element.body
    for child in list(body):
        if child.tag.endswith('sectPr'):
            continue
        body.remove(child)


def _setup_document(document):
    section = document.sections[0]
    section.top_margin = Inches(0.55)
    section.bottom_margin = Inches(0.55)
    section.left_margin = Inches(0.6)
    section.right_margin = Inches(0.6)
    normal = document.styles['Normal']
    normal.font.name = 'Arial'
    normal.font.size = Pt(9)


def _add_header(document, title):
    brand = document.add_paragraph()
    brand.alignment = WD_ALIGN_PARAGRAPH.CENTER
    brand_run = brand.add_run('Student’s Life')
    brand_run.bold = True
    brand_run.font.size = Pt(16)

    heading = document.add_paragraph()
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    heading_run = heading.add_run(title)
    heading_run.bold = True
    heading_run.font.size = Pt(14)

    generated = document.add_paragraph()
    generated.alignment = WD_ALIGN_PARAGRAPH.CENTER
    generated.add_run(f'Дата формирования: {timezone.localtime(timezone.now()):%d.%m.%Y %H:%M}')


def _add_meta_table(document, questionnaire):
    _add_section(
        document,
        'Общая информация',
        (
            ('form_type', questionnaire.get_form_type_display()),
            ('status', questionnaire.get_status_display()),
            ('submitted_at', _format_value(questionnaire.submitted_at)),
            ('generated_document_at', _format_value(timezone.now())),
        ),
    )


def _add_face_photo(document, questionnaire):
    if not questionnaire.face_photo:
        return
    try:
        paragraph = document.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run = paragraph.add_run()
        run.add_picture(questionnaire.face_photo.path, width=Inches(1.25), height=Inches(1.25))
    except (OSError, ValueError):
        return


def _add_section(document, title, rows):
    paragraph = document.add_paragraph()
    run = paragraph.add_run(title)
    run.bold = True
    run.font.size = Pt(11)

    table = document.add_table(rows=0, cols=2)
    table.style = 'Table Grid'
    for field, value in rows:
        row = table.add_row()
        label_cell, value_cell = row.cells
        label_cell.text = questionnaire_field_label(field)
        value_cell.text = _format_value(value)
        for run in label_cell.paragraphs[0].runs:
            run.bold = True
    document.add_paragraph()


def _format_field_value(questionnaire, field):
    display_method = getattr(questionnaire, f'get_{field}_display', None)
    if callable(display_method):
        value = display_method()
        if value:
            return value
    return getattr(questionnaire, field)


def _format_value(value):
    try:
        if value in VALUE_LABELS:
            return VALUE_LABELS[value]
    except TypeError:
        pass
    if value in (None, '', [], {}):
        return 'Не указано'
    if hasattr(value, 'strftime'):
        return timezone.localtime(value).strftime('%d.%m.%Y %H:%M') if hasattr(value, 'tzinfo') and value.tzinfo else value.strftime('%d.%m.%Y')
    if isinstance(value, list):
        if not value:
            return 'Не указано'
        return '\n'.join(_format_list_item(item) for item in value)
    if isinstance(value, dict):
        return ', '.join(f'{questionnaire_field_label(str(key))}: {_format_value(item)}' for key, item in value.items())
    return str(value)


def _format_list_item(item):
    if isinstance(item, dict):
        language = item.get('language') or item.get('name') or item.get('title')
        level = item.get('level')
        if language and level:
            return f'{language} — {level}'
        if language:
            return str(language)
        return ', '.join(f'{questionnaire_field_label(str(key))}: {_format_value(value)}' for key, value in item.items())
    return str(item)
