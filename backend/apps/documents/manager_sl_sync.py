import mimetypes

from apps.accounts.manager_sl_sync import build_mobile_client_payload, compact
from apps.common.manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError

from .models import UserDocument


def document_file_url(document, request=None):
    if not document.file:
        return ''
    try:
        url = document.file.url
    except ValueError:
        return ''
    return request.build_absolute_uri(url) if request else url


def build_document_payload(document, request=None):
    filename = document.original_name or document.file.name if document.file else ''
    file_type, _ = mimetypes.guess_type(filename or '')
    return {
        'client': build_mobile_client_payload(document.user),
        'mobile_document_id': document.id,
        'mobile_user_id': document.user_id,
        'title': compact(document.document_type.title, 255),
        'description': compact(document.document_type.description, 1000),
        'is_required': document.document_type.is_required,
        'status': document.status if document.status != UserDocument.Status.NOT_UPLOADED else UserDocument.Status.PENDING,
        'admin_comment': compact(document.admin_comment, 1000),
        'file_url': document_file_url(document, request=request),
        'file_type': compact(file_type or 'mobile_document', 100),
        'source': 'students_life_mobile_app',
    }


def sync_user_document_to_manager_sl(document, request=None):
    if document.status == UserDocument.Status.NOT_UPLOADED:
        return document

    client = ManagerSLClient.from_settings()
    if not client.is_configured:
        document.manager_sl_sync_status = 'failed'
        document.manager_sl_sync_error = 'MANAGER_SL_API_BASE_URL is not configured.'
        document.save(update_fields=['manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        return document

    try:
        response = client.request_json(
            'POST',
            'mobile/documents/sync/',
            payload=build_document_payload(document, request=request),
            require_api_key=True,
        )
    except (ManagerSLClientError, ManagerSLConfigError) as exc:
        document.manager_sl_sync_status = 'failed'
        document.manager_sl_sync_error = compact(str(exc), 1000)
        document.save(update_fields=['manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        return document

    document.manager_sl_document_id = compact(response.get('id') or '', 100)
    document.manager_sl_sync_status = 'synced'
    document.manager_sl_sync_error = ''
    document.save(update_fields=['manager_sl_document_id', 'manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
    return document
