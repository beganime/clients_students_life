from urllib.parse import urljoin

from django.conf import settings
from django.utils import timezone

from apps.common.manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError


MOBILE_DOCUMENT_IDEMPOTENCY_PREFIX = 'mobile-application-file'


def compact(value, max_length=None):
    value = str(value or '').strip()
    if max_length:
        return value[:max_length]
    return value


def service_direction(application):
    title = ''
    if application.service_id:
        title = compact(getattr(application.service, 'title', '')).lower()
    if 'visa' in title or 'виз' in title:
        return 'visa'
    if 'ticket' in title or 'билет' in title:
        return 'tickets'
    if 'tour' in title or 'тур' in title:
        return 'tours'
    return 'admission'


def target_name(application, relation_name, snapshot_name, external_id_name):
    related = getattr(application, relation_name, None)
    if related:
        return compact(getattr(related, 'name', related), 255)
    snapshot = compact(getattr(application, snapshot_name, ''), 255)
    if snapshot:
        return snapshot
    external_id = getattr(application, external_id_name, None)
    return f'manager-sl #{external_id}' if external_id else ''


def build_manager_sl_payload(application):
    interested_country = target_name(
        application,
        'target_country',
        'target_country_snapshot',
        'target_country_external_id',
    )
    interested_program = target_name(
        application,
        'target_program',
        'target_program_snapshot',
        'target_program_external_id',
    )
    interested_university = target_name(
        application,
        'target_university',
        'target_university_snapshot',
        'target_university_external_id',
    )

    comment_parts = []
    if application.comment:
        comment_parts.append(application.comment)
    if interested_university:
        comment_parts.append(f'University: {interested_university}')
    if application.education_level:
        comment_parts.append(f'Education level: {application.education_level}')
    if application.study_language:
        comment_parts.append(f'Study language: {application.study_language}')
    if application.start_year:
        comment_parts.append(f'Start year: {application.start_year}')
    if application.application_number:
        comment_parts.append(f'Mobile application: {application.application_number}')

    return {
        'full_name': compact(application.full_name, 255),
        'phone': compact(application.phone or application.whatsapp or application.telegram, 50),
        'email': compact(application.email, 255) or None,
        'country': compact(application.citizenship or application.country, 100),
        'city': compact(application.city, 100),
        'direction': service_direction(application),
        'interested_country': interested_country,
        'interested_program': interested_program or compact(application.specialty, 255),
        'comment': '\n'.join(part for part in comment_parts if part),
        'source': 'students_life_mobile_app',
        'mobile_application_id': application.id,
        'idempotency_key': application.idempotency_key or '',
    }


def sync_application_to_manager_sl(application):
    payload = build_manager_sl_payload(application)
    application.manager_sl_payload = payload

    client = ManagerSLClient.from_settings()
    if not client.is_configured:
        application.manager_sl_sync_status = 'failed'
        application.manager_sl_sync_error = 'MANAGER_SL_API_BASE_URL is not configured.'
        application.save(update_fields=['manager_sl_payload', 'manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        return application

    try:
        response = client.create_lead(payload, idempotency_key=application.idempotency_key)
    except (ManagerSLClientError, ManagerSLConfigError) as exc:
        application.manager_sl_sync_status = 'failed'
        application.manager_sl_sync_error = compact(str(exc), 1000)
        application.save(update_fields=['manager_sl_payload', 'manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        return application

    application.manager_sl_application_id = compact(response.get('id') or response.get('application_id'), 100)
    application.manager_sl_sync_status = 'synced'
    application.manager_sl_sync_error = ''
    application.synced_at = timezone.now()
    application.save(
        update_fields=[
            'manager_sl_payload',
            'manager_sl_application_id',
            'manager_sl_sync_status',
            'manager_sl_sync_error',
            'synced_at',
            'updated_at',
        ],
    )
    return application


def configured_public_base_url():
    return (
        getattr(settings, 'MOBILE_API_PUBLIC_BASE_URL', '')
        or getattr(settings, 'PUBLIC_BASE_URL', '')
        or getattr(settings, 'SITE_URL', '')
        or ''
    )


def build_absolute_file_url(application_file, request=None, public_base_url=''):
    if not application_file or not application_file.file:
        return ''
    try:
        url = application_file.file.url
    except ValueError:
        return ''

    if url.startswith(('http://', 'https://')):
        return url
    if request is not None:
        return request.build_absolute_uri(url)

    base_url = compact(public_base_url or configured_public_base_url())
    if not base_url:
        return url
    return urljoin(base_url.rstrip('/') + '/', url.lstrip('/'))


def build_manager_sl_document_payload(application_file, request=None, public_base_url=''):
    application = application_file.application
    user = application.user or application_file.uploaded_by
    profile = getattr(user, 'client_profile', None) if user else None
    file_type_display = application_file.get_file_type_display() if hasattr(application_file, 'get_file_type_display') else application_file.file_type
    original_name = compact(application_file.original_name, 255)
    title = compact(original_name or file_type_display or 'Mobile document', 255)

    description_parts = [
        f'Mobile application: {application.application_number}' if application.application_number else '',
        f'Mobile application ID: {application.id}',
        f'File type: {file_type_display or application_file.file_type}',
    ]
    if application.manager_sl_application_id:
        description_parts.append(f'Manager-sl lead ID: {application.manager_sl_application_id}')

    client_payload = {
        'mobile_user_id': application.user_id,
        'user_id': application.user_id,
        'username': compact(getattr(user, 'username', ''), 150),
        'first_name': compact(getattr(user, 'first_name', ''), 150),
        'last_name': compact(getattr(user, 'last_name', ''), 150),
        'full_name': compact(application.full_name or getattr(user, 'get_full_name', lambda: '')(), 255),
        'email': compact(application.email or getattr(user, 'email', ''), 255),
        'phone': compact(application.phone or getattr(profile, 'phone', ''), 100),
        'whatsapp': compact(application.whatsapp or getattr(profile, 'whatsapp', ''), 100),
        'telegram': compact(application.telegram or getattr(profile, 'telegram', ''), 100),
        'citizenship': compact(application.citizenship or getattr(profile, 'citizenship', ''), 255),
        'country': compact(application.country or getattr(profile, 'country', ''), 255),
        'city': compact(application.city or getattr(profile, 'city', ''), 255),
        'profile': {
            'phone': compact(application.phone or getattr(profile, 'phone', ''), 100),
            'whatsapp': compact(application.whatsapp or getattr(profile, 'whatsapp', ''), 100),
            'telegram': compact(application.telegram or getattr(profile, 'telegram', ''), 100),
            'citizenship': compact(application.citizenship or getattr(profile, 'citizenship', ''), 255),
            'country': compact(application.country or getattr(profile, 'country', ''), 255),
            'city': compact(application.city or getattr(profile, 'city', ''), 255),
        },
    }

    return {
        'mobile_document_id': application_file.id,
        'document_id': application_file.id,
        'mobile_application_id': application.id,
        'manager_sl_application_id': application.manager_sl_application_id,
        'mobile_user_id': application.user_id,
        'client': client_payload,
        'title': title,
        'file_type': compact(application_file.file_type or 'mobile_document', 100),
        'file_type_display': compact(file_type_display, 100),
        'original_name': original_name,
        'file_url': build_absolute_file_url(application_file, request=request, public_base_url=public_base_url),
        'status': 'pending',
        'source': 'students_life_mobile_app',
        'description': '\n'.join(part for part in description_parts if part),
        'created_at': application_file.created_at.isoformat() if application_file.created_at else '',
    }


def sync_application_file_to_manager_sl(application_file, request=None, public_base_url=''):
    client = ManagerSLClient.from_settings()
    if not client.is_configured:
        return {
            'status': 'skipped',
            'detail': 'MANAGER_SL_API_BASE_URL is not configured.',
        }

    payload = build_manager_sl_document_payload(
        application_file,
        request=request,
        public_base_url=public_base_url,
    )
    try:
        response = client.sync_mobile_document(
            payload,
            idempotency_key=f'{MOBILE_DOCUMENT_IDEMPOTENCY_PREFIX}-{application_file.id}',
        )
    except (ManagerSLClientError, ManagerSLConfigError) as exc:
        return {
            'status': 'failed',
            'detail': compact(str(exc), 1000),
        }

    return {
        'status': 'synced',
        'manager_sl_document_id': response.get('id'),
        'manager_sl_client_id': response.get('client_id'),
        'detail': response.get('detail') or 'Document synced.',
    }
