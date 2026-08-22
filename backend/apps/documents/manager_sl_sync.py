import mimetypes
import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from apps.accounts.manager_sl_sync import build_mobile_client_payload, compact
from apps.common.manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError

from .models import UserDocument


def document_file_url(document, request=None):
    if document.disk_folder_url:
        return document.disk_folder_url
    if not document.file:
        return ''
    try:
        url = document.file.url
    except ValueError:
        return ''
    return request.build_absolute_uri(url) if request else url


def build_document_payload(document, request=None):
    filename = document.original_name or (document.file.name if document.file else '')
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


def upload_user_document_to_manager_sl(document, uploaded_file):
    """Send bytes server-to-server; DiskSL credentials never reach the mobile app."""
    client = ManagerSLClient.from_settings()
    if not client.is_configured or not client.api_key:
        message = 'ManagerSL document upload is not configured.'
        document.manager_sl_sync_status = 'failed'
        document.manager_sl_sync_error = message
        document.save(update_fields=['manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        raise ManagerSLConfigError(message)

    filename = compact(getattr(uploaded_file, 'name', '') or 'document', 255)
    content_type = (
        getattr(uploaded_file, 'content_type', '')
        or mimetypes.guess_type(filename)[0]
        or 'application/octet-stream'
    )
    uploaded_file.seek(0)
    body = uploaded_file.read()
    uploaded_file.seek(0)
    headers = {
        'Accept': 'application/json',
        'Content-Type': content_type,
        'Content-Length': str(len(body)),
        'X-API-KEY': client.api_key,
        'X-Mobile-Document-ID': str(document.id),
        'X-Mobile-User-ID': str(document.user_id),
        'X-SL-ID': quote(compact(document.user.username, 100), safe=''),
        'X-Document-Title': quote(compact(document.document_type.title, 255), safe=''),
        'X-File-Name': quote(filename, safe=''),
    }
    request = Request(
        client._url('mobile/documents/upload/'),
        data=body,
        headers=headers,
        method='POST',
    )
    try:
        with urlopen(request, timeout=max(client.timeout, 120)) as response:
            raw = response.read().decode('utf-8')
            payload = json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode('utf-8', errors='replace')
        try:
            error_payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            error_payload = {}
        detail = error_payload.get('detail') or raw or exc.reason or 'ManagerSL upload error.'
        document.manager_sl_sync_status = 'failed'
        document.manager_sl_sync_error = compact(detail, 1000)
        document.save(update_fields=['manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        raise ManagerSLClientError(str(detail), status_code=exc.code, payload=error_payload) from exc
    except (URLError, TimeoutError, OSError) as exc:
        detail = f'ManagerSL upload unavailable: {exc}'
        document.manager_sl_sync_status = 'failed'
        document.manager_sl_sync_error = compact(detail, 1000)
        document.save(update_fields=['manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        raise ManagerSLClientError(detail, status_code=502) from exc

    document.manager_sl_document_id = compact(payload.get('id') or '', 100)
    document.disk_path = compact(payload.get('disk_path') or '', 1000)
    document.disk_folder_url = compact(payload.get('disk_folder_url') or '', 1000)
    document.manager_sl_sync_status = 'synced'
    document.manager_sl_sync_error = ''
    document.save(update_fields=[
        'manager_sl_document_id',
        'disk_path',
        'disk_folder_url',
        'manager_sl_sync_status',
        'manager_sl_sync_error',
        'updated_at',
    ])
    return payload
