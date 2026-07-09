from io import BytesIO

from django.utils import timezone
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

from .labels import questionnaire_field_label


BRAND_BLUE = '0D416D'
BRAND_RED = 'B8201A'
BRAND_DARK_RED = '7F1D1D'
BRAND_SOFT = 'FEF7F5'
BLUE_SOFT = 'EEF6FB'
TEXT_DARK = '172033'
TEXT_MUTED = '64748B'
LINE_SOFT = 'E6EEF5'


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
    ('10', 'Дополнительная информация', ('hobbies', 'applicant_comment', 'referral_source', 'data_processing_consent')),
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
    _add_footer_note(document)

    output = BytesIO()
    document.save(output)
    return output.getvalue()


def _setup_document(document):
    section = document.sections[0]
    section.top_margin = Inches(0.62)
    section.bottom_margin = Inches(0.62)
    section.left_margin = Inches(0.72)
    section.right_margin = Inches(0.72)

    normal = document.styles['Normal']
    normal.font.name = 'Arial'
    normal.font.size = Pt(10)
    normal.font.color.rgb = RGBColor.from_string(TEXT_DARK)
    normal.paragraph_format.space_after = Pt(4)
    normal.paragraph_format.line_spacing = 1.08


def _build_cover(document, questionnaire):
    title = (
        'Предварительная заявка школьника'
        if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT
        else 'Анкета абитуриента'
    )

    cover = document.add_table(rows=1, cols=2)
    cover.autofit = False
    _set_table_width(cover, 8500)
    _remove_table_borders(cover)
    cover.columns[0].width = Inches(5.35)
    cover.columns[1].width = Inches(1.55)

    left = cover.cell(0, 0)
    right = cover.cell(0, 1)
    _set_cell_fill(left, BRAND_BLUE)
    _set_cell_fill(right, BRAND_RED)
    _set_cell_margin(left, 260, 240, 260, 240)
    _set_cell_margin(right, 220, 180, 220, 180)

    _clear_cell(left)
    brand = left.paragraphs[0]
    brand.alignment = WD_ALIGN_PARAGRAPH.LEFT
    _add_run(brand, "Student's Life", bold=True, size=20, color='FFFFFF')
    subtitle = left.add_paragraph()
    subtitle.paragraph_format.space_before = Pt(8)
    _add_run(subtitle, title, bold=True, size=17, color='FFFFFF')
    note = left.add_paragraph()
    _add_run(note, 'Персональная карточка для поступления и сопровождения', size=9.5, color='D9EAF7')
    date = left.add_paragraph()
    _add_run(date, f'Сформировано: {timezone.localtime(timezone.now()):%d.%m.%Y %H:%M}', size=8.5, color='D9EAF7')

    _clear_cell(right)
    right.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    photo = right.paragraphs[0]
    photo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if questionnaire.face_photo:
        try:
            photo.add_run().add_picture(questionnaire.face_photo.path, width=Inches(1.08), height=Inches(1.32))
        except (OSError, ValueError):
            _add_run(photo, 'ФОТО\n3 x 4 см', bold=True, size=9, color='FFFFFF')
    else:
        _add_run(photo, 'ФОТО\n3 x 4 см', bold=True, size=9, color='FFFFFF')

    document.add_paragraph()
    _add_summary_cards(document, questionnaire)
    _add_intro_note(document, questionnaire)


def _add_summary_cards(document, questionnaire):
    cards = document.add_table(rows=1, cols=3)
    cards.autofit = False
    _set_table_width(cards, 8500)
    _remove_table_borders(cards)

    items = (
        ('ФИО', questionnaire.full_name or 'Не указано'),
        ('Статус', questionnaire.get_status_display()),
        ('Тип заявки', questionnaire.get_form_type_display()),
    )
    for index, (label, value) in enumerate(items):
        cell = cards.cell(0, index)
        _set_cell_fill(cell, BLUE_SOFT if index != 1 else BRAND_SOFT)
        _set_cell_margin(cell, 150, 150, 150, 150)
        _clear_cell(cell)
        p = cell.paragraphs[0]
        _add_run(p, label.upper(), bold=True, size=7.5, color=TEXT_MUTED)
        p = cell.add_paragraph()
        _add_run(p, _format_value(value), bold=True, size=10.5, color=BRAND_BLUE if index != 1 else BRAND_RED)


def _add_intro_note(document, questionnaire):
    p = document.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(10)
    _set_paragraph_shading(p, BRAND_SOFT)
    _set_paragraph_border(p, BRAND_RED)
    text = (
        'Эта анкета содержит предварительные данные школьника. Менеджер использует её, чтобы заранее '
        'подсказать документы, сроки и подходящие направления.'
        if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT
        else 'Эта анкета содержит данные абитуриента для подготовки документов, консультации и сопровождения поступления.'
    )
    _add_run(p, text, size=9.5, color=TEXT_DARK)


def _section_rows(questionnaire, fields):
    allowed = SCHOOL_STUDENT_FIELDS if questionnaire.form_type == questionnaire.FormType.SCHOOL_STUDENT else None
    rows = []
    for field in fields:
        if allowed is not None and field not in allowed:
            continue
        value = _format_value(_field_value(questionnaire, field))
        if value != 'Не указано':
            rows.append((questionnaire_field_label(field), value))
    return rows


def _add_section(document, number, title, rows):
    heading = document.add_paragraph()
    heading.paragraph_format.space_before = Pt(8)
    heading.paragraph_format.space_after = Pt(6)
    _set_paragraph_shading(heading, BRAND_BLUE)
    _add_run(heading, f'{number}  {title.upper()}', bold=True, size=10.5, color='FFFFFF')

    for label, value in rows:
        label_p = document.add_paragraph()
        label_p.paragraph_format.space_before = Pt(2)
        label_p.paragraph_format.space_after = Pt(1)
        _add_run(label_p, label.upper(), bold=True, size=7.4, color=BRAND_RED)

        value_p = document.add_paragraph()
        value_p.paragraph_format.left_indent = Inches(0.16)
        value_p.paragraph_format.space_after = Pt(7)
        _set_paragraph_border(value_p, LINE_SOFT)
        _add_run(value_p, value, size=9.6, color=TEXT_DARK)


def _add_manager_block(document, questionnaire):
    heading = document.add_paragraph()
    heading.paragraph_format.space_before = Pt(10)
    heading.paragraph_format.space_after = Pt(6)
    _set_paragraph_shading(heading, BRAND_DARK_RED)
    _add_run(heading, '12  ОТМЕТКИ МЕНЕДЖЕРА', bold=True, size=10.5, color='FFFFFF')

    lines = (
        ('Ответственный менеджер', '________________________________'),
        ('Дата проверки', '________________________________'),
        ('Статус анкеты', questionnaire.get_status_display()),
        ('Комментарий', '________________________________'),
        ('Подпись менеджера', '________________________________'),
        ('Подпись абитуриента / представителя', '________________________________'),
    )
    for label, value in lines:
        p = document.add_paragraph()
        p.paragraph_format.space_after = Pt(5)
        _add_run(p, f'{label}: ', bold=True, size=9, color=BRAND_BLUE)
        _add_run(p, _format_value(value), size=9, color=TEXT_DARK)


def _add_footer_note(document):
    p = document.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    _add_run(p, "Student's Life - сопровождение поступления, документов и связи с менеджером", size=8, color=TEXT_MUTED)


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
        return 'Не указано'
    if hasattr(value, 'strftime'):
        return timezone.localtime(value).strftime('%d.%m.%Y %H:%M') if hasattr(value, 'tzinfo') and value.tzinfo else value.strftime('%d.%m.%Y')
    if isinstance(value, list):
        return '\n'.join(f'- {_format_list_item(item)}' for item in value) or 'Не указано'
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


def _add_run(paragraph, text, bold=False, size=9, color=TEXT_DARK):
    run = paragraph.add_run(str(text))
    run.bold = bold
    run.font.name = 'Arial'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
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


def _set_cell_margin(cell, top=90, start=90, bottom=90, end=90):
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


def _remove_table_borders(table):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in('w:tblBorders')
    if borders is None:
        borders = OxmlElement('w:tblBorders')
        tbl_pr.append(borders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        tag = f'w:{edge}'
        node = borders.find(qn(tag))
        if node is None:
            node = OxmlElement(tag)
            borders.append(node)
        node.set(qn('w:val'), 'nil')


def _set_paragraph_shading(paragraph, fill):
    p_pr = paragraph._p.get_or_add_pPr()
    shd = p_pr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        p_pr.append(shd)
    shd.set(qn('w:fill'), fill)


def _set_paragraph_border(paragraph, color):
    p_pr = paragraph._p.get_or_add_pPr()
    borders = p_pr.find(qn('w:pBdr'))
    if borders is None:
        borders = OxmlElement('w:pBdr')
        p_pr.append(borders)
    bottom = borders.find(qn('w:bottom'))
    if bottom is None:
        bottom = OxmlElement('w:bottom')
        borders.append(bottom)
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '4')
    bottom.set(qn('w:space'), '2')
    bottom.set(qn('w:color'), color)
