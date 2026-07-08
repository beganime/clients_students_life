from io import BytesIO

from django.utils import timezone
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

from .labels import questionnaire_field_label


BRAND_BLUE = '0D416D'
BRAND_RED = 'B8201A'
BRAND_LIGHT = 'F7FAFC'
TEXT_DARK = '172033'
TEXT_MUTED = '64748B'


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


SECTIONS = (
    ('01', 'Личные данные', ('full_name', 'birth_date', 'gender', 'citizenship', 'marital_status')),
    ('02', 'Адрес проживания', ('residence_country', 'residence_region', 'residence_city', 'residence_street', 'residence_house', 'residence_postal_code')),
    ('03', 'Паспортные данные', ('passport_number', 'passport_issued_by', 'passport_issue_date', 'passport_expiry_date', 'has_international_passport')),
    ('04', 'Контакты', ('phone', 'email', 'extra_phone', 'imo', 'telegram', 'preferred_contact_method')),
    ('05', 'Родители / представители', ('parent_full_name', 'parent_relation', 'parent_contacts', 'parent_workplace', 'family_members')),
    ('06', 'Образование', ('education_status', 'education_level', 'school_class', 'school_name', 'school_country', 'school_city', 'graduation_year')),
    ('07', 'Поступление', ('desired_program', 'admission_goal', 'desired_country', 'desired_city', 'desired_language', 'desired_education_level', 'admission_urgency', 'help_needed')),
    ('08', 'Виза', ('has_visa', 'visa_country', 'visa_city', 'visa_valid_until')),
    ('09', 'Достижения и языки', ('achievements', 'languages')),
    ('10', 'Дополнительно', ('hobbies', 'applicant_comment', 'referral_source', 'data_processing_consent')),
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


def generate_questionnaire_docx(questionnaire):
    document = Document()
    _setup_document(document)
    _build_cover(document, questionnaire)

    for number, title, fields in SECTIONS:
        rows = _section_rows(questionnaire, fields)
        if rows:
            _add_section(document, number, title, rows)

    attachments = list(questionnaire.attachments.all()) if questionnaire.pk else []
    if attachments:
        _add_section(
            document,
            '11',
            'Вложения анкеты',
            [(attachment.original_name or f'Файл {index}', attachment.file_type or 'Файл') for index, attachment in enumerate(attachments, start=1)],
        )

    _add_manager_block(document, questionnaire)
    output = BytesIO()
    document.save(output)
    return output.getvalue()


def _setup_document(document):
    section = document.sections[0]
    section.top_margin = Inches(0.55)
    section.bottom_margin = Inches(0.55)
    section.left_margin = Inches(0.58)
    section.right_margin = Inches(0.58)
    normal = document.styles['Normal']
    normal.font.name = 'Arial'
    normal.font.size = Pt(9)
    normal.font.color.rgb = RGBColor.from_string(TEXT_DARK)


def _build_cover(document, questionnaire):
    title = (
        'Предварительная заявка школьника'
        if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT
        else 'Анкета абитуриента'
    )
    header = document.add_table(rows=1, cols=2)
    header.autofit = False
    _set_table_width(header, 8900)
    header.columns[0].width = Inches(5.55)
    header.columns[1].width = Inches(1.65)
    _set_cell_fill(header.cell(0, 0), BRAND_BLUE)
    _set_cell_fill(header.cell(0, 1), BRAND_RED)
    _set_cell_margin(header.cell(0, 0), 180, 180, 180, 180)
    _set_cell_margin(header.cell(0, 1), 180, 180, 180, 180)

    left = header.cell(0, 0)
    _clear_cell(left)
    p = left.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    _add_run(p, 'Student’s Life', bold=True, size=18, color='FFFFFF')
    p = left.add_paragraph()
    _add_run(p, title, bold=True, size=15, color='FFFFFF')
    p = left.add_paragraph()
    _add_run(p, 'Персональная карточка для поступления и сопровождения', size=9, color='D9EAF7')
    p = left.add_paragraph()
    _add_run(p, f'Дата формирования: {timezone.localtime(timezone.now()):%d.%m.%Y %H:%M}', size=8, color='D9EAF7')

    photo_cell = header.cell(0, 1)
    _clear_cell(photo_cell)
    photo_cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    p = photo_cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if questionnaire.face_photo:
        try:
            p.add_run().add_picture(questionnaire.face_photo.path, width=Inches(1.05), height=Inches(1.35))
        except (OSError, ValueError):
            _add_run(p, 'ФОТО\n3 x 4 см', bold=True, size=9, color='FFFFFF')
    else:
        _add_run(p, 'ФОТО\n3 x 4 см', bold=True, size=9, color='FFFFFF')

    document.add_paragraph()
    summary = document.add_table(rows=2, cols=4)
    summary.style = 'Table Grid'
    _set_table_width(summary, 8900)
    summary_rows = (
        ('ФИО', questionnaire.full_name, 'Статус', questionnaire.get_status_display()),
        ('Телефон', questionnaire.phone, 'Тип заявки', questionnaire.get_form_type_display()),
    )
    for row_index, row_values in enumerate(summary_rows):
        cells = summary.rows[row_index].cells
        for index, value in enumerate(row_values):
            _set_cell_text(cells[index], _format_value(value), bold=index % 2 == 0, color=BRAND_BLUE if index % 2 == 0 else TEXT_DARK)
            _set_cell_margin(cells[index], 95, 95, 95, 95)
            if index % 2 == 0:
                _set_cell_fill(cells[index], 'EEF6FB')


def _section_rows(questionnaire, fields):
    allowed = SCHOOL_STUDENT_FIELDS if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT else None
    rows = []
    for field in fields:
        if allowed is not None and field not in allowed:
            continue
        rows.append((questionnaire_field_label(field), _format_value(_field_value(questionnaire, field))))
    return rows


def _add_section(document, number, title, rows):
    heading_table = document.add_table(rows=1, cols=2)
    _set_table_width(heading_table, 8900)
    heading_table.columns[0].width = Inches(0.48)
    heading_table.columns[1].width = Inches(6.3)
    _set_cell_fill(heading_table.cell(0, 0), BRAND_RED)
    _set_cell_fill(heading_table.cell(0, 1), BRAND_BLUE)
    _set_cell_text(heading_table.cell(0, 0), number, bold=True, color='FFFFFF', align=WD_ALIGN_PARAGRAPH.CENTER)
    _set_cell_text(heading_table.cell(0, 1), title.upper(), bold=True, color='FFFFFF')

    table = document.add_table(rows=0, cols=4)
    table.style = 'Table Grid'
    _set_table_width(table, 8900)
    for index in range(0, len(rows), 2):
        row = table.add_row().cells
        _write_pair(row[0], row[1], rows[index])
        if index + 1 < len(rows):
            _write_pair(row[2], row[3], rows[index + 1])
        else:
            _set_cell_text(row[2], '')
            _set_cell_text(row[3], '')
    document.add_paragraph()


def _write_pair(label_cell, value_cell, pair):
    label, value = pair
    _set_cell_fill(label_cell, BRAND_LIGHT)
    _set_cell_text(label_cell, label, bold=True, color=BRAND_BLUE)
    _set_cell_text(value_cell, value)
    _set_cell_margin(label_cell, 90, 90, 90, 90)
    _set_cell_margin(value_cell, 90, 90, 90, 90)


def _add_manager_block(document, questionnaire):
    _add_section(
        document,
        '12',
        'Отметки менеджера',
        (
            ('Ответственный менеджер', '________________________'),
            ('Дата проверки', '________________________'),
            ('Статус анкеты', questionnaire.get_status_display()),
            ('Комментарий', '________________________'),
            ('Подпись менеджера', '________________________'),
            ('Подпись абитуриента / представителя', '________________________'),
        ),
    )


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
        return '\n'.join(f'• {_format_list_item(item)}' for item in value) or '—'
    if isinstance(value, dict):
        return ', '.join(f'{questionnaire_field_label(str(key))}: {_format_value(item)}' for key, item in value.items())
    return str(value)


def _format_list_item(item):
    if isinstance(item, dict):
        language = item.get('language') or item.get('name') or item.get('title')
        level = item.get('level')
        if language and level:
            return f'{language} - {level}'
        return str(language or item)
    return str(item)


def _set_cell_text(cell, text, bold=False, color=TEXT_DARK, size=8, align=None):
    _clear_cell(cell)
    paragraph = cell.paragraphs[0]
    if align is not None:
        paragraph.alignment = align
    run = _add_run(paragraph, str(text or ''), bold=bold, size=size, color=color)
    return run


def _add_run(paragraph, text, bold=False, size=8, color=TEXT_DARK):
    run = paragraph.add_run(text)
    run.bold = bold
    run.font.name = 'Arial'
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    return run


def _clear_cell(cell):
    for paragraph in cell.paragraphs:
        paragraph.clear()


def _set_cell_fill(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tc_pr.append(shd)
    shd.set(qn('w:fill'), fill)


def _set_cell_margin(cell, top=80, start=80, bottom=80, end=80):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in('w:tcMar')
    if tc_mar is None:
        tc_mar = OxmlElement('w:tcMar')
        tc_pr.append(tc_mar)
    for margin_name, value in (('top', top), ('start', start), ('bottom', bottom), ('end', end)):
        node = tc_mar.find(qn(f'w:{margin_name}'))
        if node is None:
            node = OxmlElement(f'w:{margin_name}')
            tc_mar.append(node)
        node.set(qn('w:w'), str(value))
        node.set(qn('w:type'), 'dxa')


def _set_table_width(table, width):
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn('w:tblW'))
    if tbl_w is None:
        tbl_w = OxmlElement('w:tblW')
        tbl_pr.append(tbl_w)
    tbl_w.set(qn('w:w'), str(width))
    tbl_w.set(qn('w:type'), 'dxa')
