from django.test import SimpleTestCase

from .name_parser import parse_russian_full_name


class RussianFullNameParserTests(SimpleTestCase):
    def test_surname_first_fio(self):
        parsed = parse_russian_full_name('Иванов Александр Сергеевич')
        self.assertEqual(parsed.last_name, 'Иванов')
        self.assertEqual(parsed.first_name, 'Александр')
        self.assertEqual(parsed.patronymic, 'Сергеевич')

    def test_given_name_first_fio(self):
        parsed = parse_russian_full_name('Регина Петрова Ивановна')
        self.assertEqual(parsed.last_name, 'Петрова')
        self.assertEqual(parsed.first_name, 'Регина')
        self.assertEqual(parsed.patronymic, 'Ивановна')

    def test_non_declining_surname(self):
        parsed = parse_russian_full_name('Шевченко Тимур Олегович')
        self.assertEqual(parsed.last_name, 'Шевченко')
        self.assertEqual(parsed.first_name, 'Тимур')
