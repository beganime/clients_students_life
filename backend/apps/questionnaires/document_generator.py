import os
from io import BytesIO

from django.utils import timezone
from docx import Document
from docx.shared import Inches, Pt

from .labels import questionnaire_field_label


TEMPLATE_PATH = os.path.join(
    os.path.dirname(__file__),
    'document_templates',
    'anketa_students_life_template_v2.docx',
)


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
    if len(document.tables) < 14:
        _setup_plain_document(document)
        _append_compact_sections(document, questionnaire)
    else:
        _fill_student_life_template(document, questionnaire)

    output = BytesIO()
    document.save(output)
    return output.getvalue()


def _load_template():
    if os.path.exists(TEMPLATE_PATH):
        return Document(TEMPLATE_PATH)
    return Document()


def _fill_student_life_template(document, questionnaire):
    tables = document.tables
    title = (
        'ПРЕДВАРИТЕЛЬНАЯ ЗАЯВКА ШКОЛЬНИКА'
        if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT
        else 'АНКЕТА АБИТУРИЕНТА'
    )
    _set_cell_text(
        tables[0].cell(0, 0),
        f'{title}\nПерсональная карточка для поступления и сопровождения\n'
        f'Дата формирования: {timezone.localtime(timezone.now()):%d.%m.%Y %H:%M}',
        bold=True,
        size=12,
    )
    _set_photo_cell(tables[0].cell(0, 1), questionnaire)

    _set_pair_values(tables[1], 1, 'full_name', questionnaire.full_name, 'birth_date', questionnaire.birth_date)
    _set_pair_values(tables[1], 2, 'gender', _field_value(questionnaire, 'gender'), 'citizenship', questionnaire.citizenship)
    _set_pair_values(tables[1], 3, 'marital_status', questionnaire.marital_status)

    _set_pair_values(tables[2], 1, 'residence_country', questionnaire.residence_country, 'residence_region', questionnaire.residence_region)
    _set_pair_values(tables[2], 2, 'residence_city', questionnaire.residence_city, 'residence_street', questionnaire.residence_street)
    _set_pair_values(tables[2], 3, 'residence_house', questionnaire.residence_house, 'residence_postal_code', questionnaire.residence_postal_code)

    _set_pair_values(tables[3], 1, 'passport_number', questionnaire.passport_number, 'passport_issued_by', questionnaire.passport_issued_by)
    _set_pair_values(tables[3], 2, 'passport_issue_date', questionnaire.passport_issue_date, 'passport_expiry_date', questionnaire.passport_expiry_date)
    _set_pair_values(tables[3], 3, 'has_international_passport', questionnaire.has_international_passport)

    _set_pair_values(tables[4], 1, 'phone', questionnaire.phone, 'email', questionnaire.email)
    _set_pair_values(tables[4], 2, 'extra_phone', questionnaire.extra_phone, 'imo', questionnaire.imo)
    _set_pair_values(tables[4], 3, 'telegram', questionnaire.telegram, 'preferred_contact_method', questionnaire.preferred_contact_method)

    _set_pair_values(tables[5], 1, 'parent_full_name', questionnaire.parent_full_name, 'parent_relation', questionnaire.parent_relation)
    _set_pair_values(tables[5], 2, 'parent_contacts', questionnaire.parent_contacts, 'parent_workplace', questionnaire.parent_workplace)
    _set_pair_values(tables[5], 3, 'family_members', questionnaire.family_members)

    _set_pair_values(tables[6], 1, 'education_level', questionnaire.education_level, 'school_name', questionnaire.school_name)
    _set_pair_values(tables[6], 2, 'school_country', questionnaire.school_country, 'school_city', questionnaire.school_city)
    _set_pair_values(tables[6], 3, 'graduation_year', questionnaire.graduation_year, 'education_status', questionnaire.education_status)
    if questionnaire.school_class:
        _append_pair_row(tables[6], 'school_class', questionnaire.school_class)

    _set_pair_values(tables[7], 1, 'desired_program', questionnaire.desired_program, 'admission_goal', questionnaire.admission_goal)
    _set_pair_values(tables[7], 2, 'desired_city', questionnaire.desired_city, 'desired_country', questionnaire.desired_country)
    _set_pair_values(tables[7], 3, 'desired_language', questionnaire.desired_language, 'desired_education_level', questionnaire.desired_education_level)
    _set_pair_values(tables[7], 4, 'admission_urgency', questionnaire.admission_urgency)

    _set_pair_values(tables[8], 1, 'has_visa', questionnaire.has_visa)
    if questionnaire.visa_country or questionnaire.visa_city:
        _append_pair_row(tables[8], 'visa_country', questionnaire.visa_country, 'visa_city', questionnaire.visa_city)
    if questionnaire.visa_valid_until:
        _append_pair_row(tables[8], 'visa_valid_until', questionnaire.visa_valid_until)

    _set_pair_values(tables[9], 1, 'referral_source', questionnaire.referral_source)
    if questionnaire.hobbies:
        _append_pair_row(tables[9], 'hobbies', questionnaire.hobbies)
    if questionnaire.applicant_comment:
        _append_pair_row(tables[9], 'applicant_comment', questionnaire.applicant_comment)
    _append_pair_row(tables[9], 'data_processing_consent', questionnaire.data_processing_consent)

    _fill_languages_table(tables[10], questionnaire.languages or [])
    _set_single_value(tables[11], 1, _bullet_list(questionnaire.achievements or []))
    _set_single_value(tables[12], 1, _bullet_list(questionnaire.help_needed or []))

    _set_pair_values(tables[13], 1, 'status', questionnaire.get_status_display())
    _set_pair_values(tables[13], 2, 'generated_document_at', timezone.now())

    attachments = list(questionnaire.attachments.all()) if questionnaire.pk else []
    if attachments:
        document.add_page_break()
        _append_section_table(
            document,
            'ВЛОЖЕНИЯ АНКЕТЫ',
            [(attachment.original_name or f'Файл {index}', attachment.file_type or 'Файл') for index, attachment in enumerate(attachments, start=1)],
        )


def _setup_plain_document(document):
    section = document.sections[0]
    section.top_margin = Inches(0.47)
    section.bottom_margin = Inches(0.5)
    section.left_margin = Inches(0.5)
    section.right_margin = Inches(0.5)
    normal = document.styles['Normal']
    normal.font.name = 'Arial'
    normal.font.size = Pt(9)


def _append_compact_sections(document, questionnaire):
    _append_section_table(
        document,
        'АНКЕТА АБИТУРИЕНТА',
        (
            ('Тип заявки', questionnaire.get_form_type_display()),
            ('Статус', questionnaire.get_status_display()),
            ('ФИО', questionnaire.full_name),
            ('Телефон', questionnaire.phone),
            ('Email', questionnaire.email),
            ('Желаемая программа / вуз', questionnaire.desired_program),
        ),
    )


def _set_pair_values(table, row_index, field_one, value_one, field_two=None, value_two=None):
    row = table.rows[row_index]
    cells = row.cells
    _set_cell_text(cells[0], questionnaire_field_label(field_one), bold=True)
    _set_cell_text(cells[3], _format_value(value_one))
    if field_two and len(cells) > 6:
        _set_cell_text(cells[5], questionnaire_field_label(field_two), bold=True)
        _set_cell_text(cells[6], _format_value(value_two))
    elif len(cells) > 5:
        _set_cell_text(cells[5], '')
        _set_cell_text(cells[6], '')


def _append_pair_row(table, field_one, value_one, field_two=None, value_two=None):
    row = table.add_row()
    cells = row.cells
    if len(cells) >= 7:
        _set_cell_text(cells[0], questionnaire_field_label(field_one), bold=True)
        _set_cell_text(cells[3], _format_value(value_one))
        if field_two:
            _set_cell_text(cells[5], questionnaire_field_label(field_two), bold=True)
            _set_cell_text(cells[6], _format_value(value_two))
        return
    _set_cell_text(cells[0], questionnaire_field_label(field_one), bold=True)
    if len(cells) > 3:
        _set_cell_text(cells[3], _format_value(value_one))


def _fill_languages_table(table, languages):
    language_rows = [_format_language_row(item) for item in languages]
    if not language_rows:
        language_rows = [('Языки', 'Не указано')]
    for index, (language, level) in enumerate(language_rows):
        row = table.rows[index + 1] if index + 1 < len(table.rows) else table.add_row()
        cells = row.cells
        _set_cell_text(cells[0], language, bold=True)
        if len(cells) > 3:
            _set_cell_text(cells[3], level)
    for index in range(len(language_rows) + 1, len(table.rows)):
        cells = table.rows[index].cells
        _set_cell_text(cells[0], '')
        if len(cells) > 3:
            _set_cell_text(cells[3], '')


def _set_single_value(table, row_index, value):
    row = table.rows[row_index]
    _set_cell_text(row.cells[0], _format_value(value))


def _append_section_table(document, title, rows):
    table = document.add_table(rows=1, cols=2)
    table.style = 'Table Grid'
    _set_cell_text(table.cell(0, 0), title, bold=True)
    _set_cell_text(table.cell(0, 1), '')
    for label, value in rows:
        row = table.add_row()
        _set_cell_text(row.cells[0], label, bold=True)
        _set_cell_text(row.cells[1], _format_value(value))


def _set_photo_cell(cell, questionnaire):
    if questionnaire.face_photo:
        try:
            _clear_cell(cell)
            paragraph = cell.paragraphs[0]
            paragraph.alignment = 1
            paragraph.add_run().add_picture(questionnaire.face_photo.path, width=Inches(1.1), height=Inches(1.45))
            return
        except (OSError, ValueError):
            pass
    _set_cell_text(cell, 'ФОТО\n3 × 4 см\nФото не загружено', bold=True)


def _set_cell_text(cell, text, bold=False, size=8):
    _clear_cell(cell)
    paragraph = cell.paragraphs[0]
    run = paragraph.add_run(str(text or ''))
    run.bold = bold
    run.font.size = Pt(size)


def _clear_cell(cell):
    for paragraph in cell.paragraphs:
        paragraph.clear()


def _field_value(questionnaire, field):
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
        return '—'
    if hasattr(value, 'strftime'):
        return timezone.localtime(value).strftime('%d.%m.%Y %H:%M') if hasattr(value, 'tzinfo') and value.tzinfo else value.strftime('%d.%m.%Y')
    if isinstance(value, list):
        return _bullet_list(value)
    if isinstance(value, dict):
        return ', '.join(f'{questionnaire_field_label(str(key))}: {_format_value(item)}' for key, item in value.items())
    return str(value)


def _bullet_list(items):
    if not items:
        return '—'
    return '\n'.join(f'• {_format_list_item(item)}' for item in items)


def _format_language_row(item):
    if isinstance(item, dict):
        return (str(item.get('language') or item.get('name') or item.get('title') or 'Язык'), str(item.get('level') or '—'))
    return (str(item), '—')


def _format_list_item(item):
    if isinstance(item, dict):
        language, level = _format_language_row(item)
        if language and level != '—':
            return f'{language} — {level}'
        return language
    return str(item)
