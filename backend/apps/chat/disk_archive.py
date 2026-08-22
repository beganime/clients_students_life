import json
import mimetypes
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from apps.accounts.manager_sl_sync import compact
from apps.common.manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError


def archive_chat_attachment(uploaded_file, *, sl_id, mobile_user_id='', actor=''):
    """Archive a chat upload through ManagerSL without exposing DiskSL credentials."""
    if not uploaded_file:
        return None
    client = ManagerSLClient.from_settings()
    if not client.is_configured or not client.api_key:
        raise ManagerSLConfigError('ManagerSL chat archive is not configured.')

    filename = compact(getattr(uploaded_file, 'name', '') or 'chat-file', 255)
    content_type = (
        getattr(uploaded_file, 'content_type', '')
        or mimetypes.guess_type(filename)[0]
        or 'application/octet-stream'
    )
    uploaded_file.seek(0)
    body = uploaded_file.read()
    uploaded_file.seek(0)
    request = Request(
        client._url('mobile/chat/upload/'),
        data=body,
        headers={
            'Accept': 'application/json',
            'Content-Type': content_type,
            'Content-Length': str(len(body)),
            'X-API-KEY': client.api_key,
            'X-Mobile-User-ID': str(mobile_user_id or ''),
            'X-SL-ID': quote(compact(sl_id, 100), safe=''),
            'X-File-Name': quote(filename, safe=''),
            'X-Actor': quote(compact(actor, 255), safe=''),
        },
        method='POST',
    )
    try:
        with urlopen(request, timeout=max(client.timeout, 120)) as response:
            raw = response.read().decode('utf-8')
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode('utf-8', errors='replace')
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        detail = payload.get('detail') or raw or exc.reason or 'ManagerSL chat archive error.'
        raise ManagerSLClientError(str(detail), status_code=exc.code, payload=payload) from exc
    except (URLError, TimeoutError, OSError) as exc:
        raise ManagerSLClientError(f'ManagerSL chat archive unavailable: {exc}', status_code=502) from exc
