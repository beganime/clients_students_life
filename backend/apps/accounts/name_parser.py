import re
from dataclasses import dataclass


PATRONYMIC_SUFFIXES = (
    'ович', 'евич', 'овна', 'евна', 'ична', 'инична',
)
SURNAME_SUFFIXES = (
    'ов', 'ев', 'ин', 'ын', 'ский', 'цкий', 'ой', 'ый',
    'ова', 'ева', 'ина', 'ына', 'ская', 'цкая', 'ая', 'яя',
    'енко', 'ко', 'их', 'ых', 'аво', 'яго', 'ово',
)
COMMON_GIVEN_NAMES = {
    'александр', 'александра', 'алексей', 'алёна', 'анна', 'артём',
    'бегенч', 'вася', 'виктор', 'дарья', 'елена', 'иван', 'ирина',
    'марина', 'мария', 'наргиза', 'олеся', 'ольга', 'оля', 'регина',
    'саша', 'сергей', 'тимур', 'эзиз', 'юлия',
}


@dataclass(frozen=True)
class ParsedFullName:
    first_name: str = ''
    last_name: str = ''
    patronymic: str = ''


def _letters(value):
    return re.sub(r'[^a-zа-яё-]', '', str(value or '').casefold())


def _is_patronymic(value):
    word = _letters(value)
    return word.endswith(PATRONYMIC_SUFFIXES) or (
        word.endswith('ич') and len(word) >= 5
    )


def _surname_score(value):
    word = _letters(value)
    if not word:
        return 0
    if word in COMMON_GIVEN_NAMES:
        return -10
    for suffix in sorted(SURNAME_SUFFIXES, key=len, reverse=True):
        if word.endswith(suffix) and len(word) > len(suffix) + 1:
            return len(suffix) + 10
    # Common non-declining foreign surnames on a vowel are only a fallback.
    if word.endswith(('а', 'я', 'о', 'е', 'и', 'у', 'ю')):
        return 1
    return 2 if len(word) >= 4 else 0


def parse_russian_full_name(value):
    """Parse a Russian-style FIO without assuming the entered word order."""
    parts = [part for part in re.split(r'\s+', str(value or '').strip()) if part]
    if not parts:
        return ParsedFullName()
    if len(parts) == 1:
        return ParsedFullName(first_name=parts[0])

    patronymic_index = next((index for index, part in enumerate(parts) if _is_patronymic(part)), None)
    candidate_indexes = [index for index in range(len(parts)) if index != patronymic_index]
    surname_index = max(candidate_indexes, key=lambda index: (_surname_score(parts[index]), -index))

    first_index = next((index for index in candidate_indexes if index != surname_index), surname_index)
    return ParsedFullName(
        first_name=parts[first_index],
        last_name=parts[surname_index] if surname_index != first_index else '',
        patronymic=parts[patronymic_index] if patronymic_index is not None else '',
    )
