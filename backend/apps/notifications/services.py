import firebase_admin
from django.conf import settings
from django.utils import timezone
from firebase_admin import credentials, messaging

from .models import ClientExam, DeviceToken, UserNotification


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


def send_exam_reminder(exam: ClientExam, *, force=False):
    if not exam.is_active or exam.acknowledged_by_user:
        return False
    now = timezone.now()
    if not force and exam.next_reminder_at and exam.next_reminder_at > now:
        return False

    title = 'Напоминание об экзамене'
    body = f'У вас экзамен: {exam.subject}. Дата: {exam.exam_date:%d.%m.%Y}, время: {exam.exam_time:%H:%M}.'
    if exam.comment:
        body = f'{body} {exam.comment}'

    send_push_to_user(
        user=exam.user,
        title=title,
        body=body,
        notification_type='exam',
        related_object_type='client_exam',
        related_object_id=exam.id,
    )
    exam.last_reminded_at = now
    exam.next_reminder_at = exam.compute_next_reminder_at(now)
    exam.save(update_fields=['last_reminded_at', 'next_reminder_at', 'updated_at'])
    return True
