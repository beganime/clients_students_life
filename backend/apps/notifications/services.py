import firebase_admin
from django.conf import settings
from firebase_admin import credentials, messaging

from .models import DeviceToken, UserNotification


_firebase_initialized = False


def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return

    credentials_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '')
    if not credentials_path:
        return

    if not firebase_admin._apps:
        cred = credentials.Certificate(credentials_path)
        firebase_admin.initialize_app(cred)

    _firebase_initialized = True


def send_push_to_user(user, title, body, notification_type='', related_object_type='', related_object_id=None):
    UserNotification.objects.create(
        user=user,
        title=title,
        body=body,
        notification_type=notification_type,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
    )

    tokens = DeviceToken.objects.filter(user=user, is_active=True).values_list('token', flat=True)
    tokens = list(tokens)
    if not tokens:
        return

    init_firebase()
    if not firebase_admin._apps:
        return

    for token in tokens:
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                token=token,
                data={
                    'notification_type': notification_type or '',
                    'related_object_type': related_object_type or '',
                    'related_object_id': str(related_object_id or ''),
                },
            )
            messaging.send(message)
        except Exception:
            DeviceToken.objects.filter(token=token).update(is_active=False)