import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen

from django.conf import settings


class ManagerSLConfigError(Exception):
    pass


class ManagerSLClientError(Exception):
    def __init__(self, detail: str, status_code: int = 502, payload: Any = None):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code
        self.payload = payload


@dataclass(frozen=True)
class ManagerSLClient:
    base_url: str
    api_key: str = ''
    timeout: int = 8

    @classmethod
    def from_settings(cls):
        return cls(
            base_url=getattr(settings, 'MANAGER_SL_API_BASE_URL', ''),
            api_key=getattr(settings, 'MANAGER_SL_LEADS_API_KEY', ''),
            timeout=getattr(settings, 'MANAGER_SL_TIMEOUT_SECONDS', 8),
        )

    @property
    def is_configured(self):
        return bool(self.base_url)

    def _url(self, path: str, params: dict[str, Any] | None = None):
        if not self.base_url:
            raise ManagerSLConfigError('MANAGER_SL_API_BASE_URL is not configured.')

        base = self.base_url.rstrip('/') + '/'
        url = urljoin(base, path.lstrip('/'))

        clean_params = {
            key: value
            for key, value in (params or {}).items()
            if value not in (None, '', [], {})
        }
        if clean_params:
            url = f'{url}?{urlencode(clean_params, doseq=True)}'
        return url

    def request_json(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        payload: dict[str, Any] | None = None,
        require_api_key: bool = False,
        extra_headers: dict[str, str] | None = None,
    ):
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        if require_api_key:
            if not self.api_key:
                raise ManagerSLConfigError('MANAGER_SL_LEADS_API_KEY is not configured.')
            headers['X-API-KEY'] = self.api_key
        headers.update(extra_headers or {})

        body = None
        if payload is not None:
            body = json.dumps(payload).encode('utf-8')

        request = Request(
            self._url(path, params=params),
            data=body,
            headers=headers,
            method=method.upper(),
        )

        try:
            with urlopen(request, timeout=self.timeout) as response:
                raw = response.read().decode('utf-8')
                return json.loads(raw) if raw else {}
        except HTTPError as exc:
            raw = exc.read().decode('utf-8', errors='replace')
            payload_data = None
            detail = raw or exc.reason or 'manager-sl API error'
            try:
                payload_data = json.loads(raw) if raw else None
                detail = payload_data.get('detail') if isinstance(payload_data, dict) else detail
            except json.JSONDecodeError:
                pass
            raise ManagerSLClientError(str(detail), status_code=exc.code, payload=payload_data) from exc
        except URLError as exc:
            raise ManagerSLClientError(f'manager-sl API unavailable: {exc.reason}', status_code=502) from exc
        except TimeoutError as exc:
            raise ManagerSLClientError('manager-sl API timeout.', status_code=504) from exc

    def get_client_resource(self, resource: str, params: dict[str, Any] | None = None, pk: str | int | None = None):
        suffix = f'{resource}/{pk}/' if pk is not None else f'{resource}/'
        return self.request_json('GET', f'client/v1/{suffix}', params=params)

    def create_lead(self, payload: dict[str, Any], idempotency_key: str | None = None):
        headers = {}
        if idempotency_key:
            headers['Idempotency-Key'] = idempotency_key
        return self.request_json(
            'POST',
            'leads/create/',
            payload=payload,
            require_api_key=True,
            extra_headers=headers,
        )

    def sync_mobile_document(self, payload: dict[str, Any], idempotency_key: str | None = None):
        headers = {}
        if idempotency_key:
            headers['Idempotency-Key'] = idempotency_key
        return self.request_json(
            'POST',
            'mobile/documents/sync/',
            payload=payload,
            require_api_key=True,
            extra_headers=headers,
        )


def manager_sl_enabled():
    return ManagerSLClient.from_settings().is_configured
