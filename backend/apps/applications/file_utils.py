import os
import mimetypes

from django.conf import settings
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers


ALLOWED_APPLICATION_FILE_TYPES = {
    'application/pdf': {'.pdf'},
    'image/jpeg': {'.jpg', '.jpeg'},
    'image/png': {'.png'},
    'image/webp': {'.webp'},
}


def clean_original_name(uploaded):
    return os.path.basename(getattr(uploaded, 'name', '') or 'application-file')[:255]


def validate_application_file(uploaded):
    if not uploaded:
        raise serializers.ValidationError('Файл обязателен.')

    max_size = getattr(settings, 'APPLICATION_FILE_MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
    if uploaded.size > max_size:
        raise serializers.ValidationError('Файл слишком большой.')

    original_name = clean_original_name(uploaded)
    extension = os.path.splitext(original_name)[1].lower()
    content_type = str(getattr(uploaded, 'content_type', '') or '').lower()
    if not content_type or content_type == 'application/octet-stream':
        guessed_type, _ = mimetypes.guess_type(original_name)
        content_type = (guessed_type or content_type).lower()
    allowed_extensions = ALLOWED_APPLICATION_FILE_TYPES.get(content_type)

    if not allowed_extensions or extension not in allowed_extensions:
        raise serializers.ValidationError('Разрешены только PDF, JPEG, PNG или WebP.')

    try:
        uploaded.seek(0)
        head = uploaded.read(12)
        uploaded.seek(0)
    except OSError as exc:
        raise serializers.ValidationError('Не удалось прочитать файл.') from exc

    if content_type == 'application/pdf':
        if not head.startswith(b'%PDF-'):
            raise serializers.ValidationError('PDF файл поврежден или имеет неверный формат.')
        return original_name

    try:
        image = Image.open(uploaded)
        image.verify()
        uploaded.seek(0)
    except (UnidentifiedImageError, OSError) as exc:
        raise serializers.ValidationError('Изображение повреждено или имеет неверный формат.') from exc

    return original_name
