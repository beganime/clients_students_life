from dataclasses import dataclass

import requests
from django.conf import settings


class AkylChatError(RuntimeError):
    pass


@dataclass
class AkylChatClient:
    base_url: str = ""
    token: str = ""
    timeout: int = 20

    def __post_init__(self):
        self.base_url = (self.base_url or settings.AKYLCHAT_API_BASE_URL).rstrip("/")
        self.token = self.token or settings.AKYLCHAT_SERVICE_TOKEN
        self.timeout = int(self.timeout or getattr(settings, "MANAGER_SL_TIMEOUT_SECONDS", 20))

    @property
    def configured(self):
        return bool(self.base_url and self.token)

    def request(self, method, path, *, params=None, data=None, files=None):
        if not self.configured:
            raise AkylChatError("Akylchat service is not configured.")
        try:
            response = requests.request(
                method,
                f"{self.base_url}/{path.lstrip('/')}",
                params=params,
                data=data if files else None,
                json=None if files else data,
                files=files,
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise AkylChatError(f"Akylchat is unavailable: {exc}") from exc
        if response.status_code >= 400:
            try:
                detail = response.json().get("detail")
            except (ValueError, AttributeError):
                detail = response.text[:500]
            raise AkylChatError(detail or f"Akylchat returned HTTP {response.status_code}.")
        try:
            return response.json()
        except ValueError as exc:
            raise AkylChatError("Akylchat returned an invalid response.") from exc

    def provision_client(self, payload):
        return self.request("post", "internal/sl/provision/", data=payload)

    def rooms(self, *, sl_id="", actor="client"):
        return self.request(
            "get",
            "internal/sl/support-chats/",
            params={"sl_id": sl_id, "actor": actor},
        )

    def messages(self, sl_id, *, actor="client"):
        return self.request(
            "get",
            f"internal/sl/support-chats/{sl_id}/messages/",
            params={"actor": actor},
        )

    def send_message(self, sl_id, *, actor, text="", upload=None, upload_field="file", manager_name=""):
        data = {"actor": actor, "text": text, "manager_name": manager_name}
        files = None
        if upload is not None:
            files = {
                upload_field: (
                    getattr(upload, "name", "upload"),
                    upload.file,
                    getattr(upload, "content_type", "application/octet-stream"),
                )
            }
        return self.request(
            "post",
            f"internal/sl/support-chats/{sl_id}/messages/",
            data=data,
            files=files,
        )

    def mark_read(self, sl_id, *, actor="client"):
        return self.request(
            "post",
            f"internal/sl/support-chats/{sl_id}/read/",
            data={"actor": actor},
        )


def provision_akylchat_client(*, sl_id, password, full_name, email="", phone=""):
    client = AkylChatClient()
    if not client.configured:
        return {"status": "disabled"}
    return client.provision_client(
        {
            "sl_id": sl_id,
            "password": password,
            "full_name": full_name,
            "email": email,
            "phone": phone,
        }
    )
