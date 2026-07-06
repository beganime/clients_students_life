from apps.common.manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError

from .models import ensure_client_profile


def compact(value, max_length=None):
    value = str(value or '').strip()
    if max_length:
        return value[:max_length]
    return value


def build_mobile_client_payload(user):
    profile = ensure_client_profile(user)
    return {
        'mobile_user_id': user.id,
        'username': compact(getattr(user, 'username', ''), 255),
        'email': compact(getattr(user, 'email', ''), 255),
        'first_name': compact(getattr(user, 'first_name', ''), 150),
        'last_name': compact(getattr(user, 'last_name', ''), 150),
        'full_name': compact(user.get_full_name() or getattr(user, 'email', ''), 255),
        'phone': compact(profile.phone, 50),
        'whatsapp': compact(profile.whatsapp, 50),
        'telegram': compact(profile.telegram, 80),
        'citizenship': compact(profile.citizenship, 100),
        'country': compact(profile.country, 100),
        'city': compact(profile.city, 100),
        'profile': {
            'phone': compact(profile.phone, 50),
            'whatsapp': compact(profile.whatsapp, 50),
            'telegram': compact(profile.telegram, 80),
            'citizenship': compact(profile.citizenship, 100),
            'country': compact(profile.country, 100),
            'city': compact(profile.city, 100),
            'language': compact(profile.language, 20),
        },
        'source': 'students_life_mobile_app',
    }


def sync_mobile_client_to_manager_sl(user):
    client = ManagerSLClient.from_settings()
    if not client.is_configured:
        return None
    try:
        return client.request_json(
            'POST',
            'mobile/clients/sync/',
            payload=build_mobile_client_payload(user),
            require_api_key=True,
        )
    except (ManagerSLClientError, ManagerSLConfigError):
        return None
