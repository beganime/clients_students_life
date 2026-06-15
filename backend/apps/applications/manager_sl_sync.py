from django.utils import timezone

from apps.common.manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError


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
