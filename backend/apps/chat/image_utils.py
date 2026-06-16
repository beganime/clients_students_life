import os
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework import serializers


ALLOWED_IMAGE_CONTENT_TYPES = {
    'image/jpeg',
    'image/png',
    'image/webp',
}

ALLOWED_IMAGE_EXTENSIONS = {
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
}


def clean_original_name(uploaded):
    return os.path.basename(getattr(uploaded, 'name', '') or 'chat-image')[:255]


def prepare_chat_image(uploaded):
    original_name = clean_original_name(uploaded)
    content_type = str(getattr(uploaded, 'content_type', '') or '').lower()
    extension = os.path.splitext(original_name)[1].lower()

    max_upload_size = getattr(settings, 'CHAT_IMAGE_MAX_UPLOAD_SIZE', 6 * 1024 * 1024)
    max_stored_size = getattr(settings, 'CHAT_IMAGE_MAX_STORED_SIZE', 2 * 1024 * 1024)
    max_dimension = getattr(settings, 'CHAT_IMAGE_MAX_DIMENSION', 1600)

    if uploaded.size > max_upload_size:
        raise serializers.ValidationError('Фото слишком большое.')

    if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise serializers.ValidationError('Можно отправлять только JPEG, PNG или WebP.')

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise serializers.ValidationError('Недопустимое расширение изображения.')

    try:
        uploaded.seek(0)
        probe = Image.open(uploaded)
        probe.verify()
        uploaded.seek(0)
        image = Image.open(uploaded)
        image = ImageOps.exif_transpose(image)
    except (UnidentifiedImageError, OSError) as exc:
        raise serializers.ValidationError('Файл не похож на корректное изображение.') from exc

    image.thumbnail((max_dimension, max_dimension))
    if image.mode not in ('RGB', 'L'):
        image = image.convert('RGB')

    output = BytesIO()
    for quality in (82, 74, 66, 58):
        output.seek(0)
        output.truncate(0)
        image.save(output, format='JPEG', quality=quality, optimize=True)
        if output.tell() <= max_stored_size:
            break
    else:
        raise serializers.ValidationError('Фото не удалось сжать до допустимого размера.')

    width, height = image.size
    filename_root = os.path.splitext(original_name)[0] or 'chat-image'
    safe_filename = f'{filename_root[:80]}.jpg'
    compressed = ContentFile(output.getvalue(), name=safe_filename)
    return {
        'file': compressed,
        'original_name': original_name,
        'content_type': 'image/jpeg',
        'size': compressed.size,
        'width': width,
        'height': height,
    }
