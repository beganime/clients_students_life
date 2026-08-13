import firebase_admin
import requests
from django.conf import settings
from django.utils import timezone
from firebase_admin import credentials, messaging

from .models import AdminReminder, ClientExam, DeviceToken, PushNotification, UserNotification


_firebase_initialized = False


def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return

    credentials_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '')
    if not credentials_path:
        return

    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
    except Exception:
        return

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


def send_raw_push_to_tokens(tokens, title, body, data=None):
    tokens = [token for token in tokens if token]
    if not tokens:
        return 0

    init_firebase()
    if not firebase_admin._apps:
        return 0

    sent = 0
    payload = {key: str(value) for key, value in (data or {}).items() if value is not None}
    for token in tokens:
        try:
            messaging.send(messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                token=token,
                data=payload,
            ))
            sent += 1
        except Exception:
            DeviceToken.objects.filter(token=token).update(is_active=False)
    return sent


def send_push_notification(notification: PushNotification):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    if notification.target_type == PushNotification.TargetType.USERS:
        users = notification.target_users.filter(is_active=True).distinct()
    elif notification.target_type == PushNotification.TargetType.ANONYMOUS:
        users = User.objects.none()
    else:
        users = User.objects.filter(is_active=True)

    created = 0
    for user in users.iterator():
        UserNotification.objects.create(
            user=user,
            title=notification.title,
            body=notification.body,
            notification_type='broadcast',
            related_object_type='push_notification',
            related_object_id=notification.id,
        )
        created += 1

    if notification.target_type == PushNotification.TargetType.ANONYMOUS:
        tokens = DeviceToken.objects.filter(user__isnull=True, is_active=True).values_list('token', flat=True)
    elif notification.target_type == PushNotification.TargetType.USERS:
        tokens = DeviceToken.objects.filter(user__in=users, is_active=True).values_list('token', flat=True)
    else:
        tokens = DeviceToken.objects.filter(is_active=True).values_list('token', flat=True)

    sent = send_raw_push_to_tokens(
        list(tokens),
        notification.title,
        notification.body,
        data={
            'notification_type': 'broadcast',
            'related_object_type': 'push_notification',
            'related_object_id': notification.id,
        },
    )
    notification.status = PushNotification.Status.SENT
    notification.sent_at = timezone.now()
    notification.save(update_fields=['status', 'sent_at', 'updated_at'])
    return {'internal_created': created, 'push_sent': sent}


def _exam_notification_kind(exam, now):
    local_now = timezone.localtime(now, exam.starts_at.tzinfo)
    if local_now.date() == exam.exam_date and not exam.exam_day_notified_at:
        return 'exam_day'
    if local_now.date() == exam.exam_date - timezone.timedelta(days=1) and not exam.day_before_notified_at:
        return 'day_before'
    return None


def send_exam_reminder(exam: ClientExam, *, force=False, kind=None):
    if not exam.is_active:
        return False
    now = timezone.now()
    if not force and exam.next_reminder_at and exam.next_reminder_at > now:
        return False

    kind = kind or _exam_notification_kind(exam, now)
    if kind == 'created' and exam.creation_notified_at:
        return False
    if kind == 'day_before' and exam.day_before_notified_at:
        return False
    if kind == 'exam_day' and exam.exam_day_notified_at:
        return False
    if kind not in {'created', 'day_before', 'exam_day'}:
        exam.next_reminder_at = exam.compute_next_reminder_at(now)
        exam.save(update_fields=['next_reminder_at', 'updated_at'])
        return False

    title = {
        'created': 'Добавлен экзамен',
        'day_before': 'Экзамен завтра',
        'exam_day': 'Экзамен сегодня',
    }[kind]
    body = f'{exam.university}. Дата экзамена: {exam.exam_date:%d.%m.%Y}.'

    UserNotification.objects.create(
        user=exam.user,
        title=title,
        body=body,
        notification_type='exam',
        related_object_type='client_exam',
        related_object_id=exam.id,
    )
    selected_tokens = list(exam.target_devices.filter(is_active=True).values_list('token', flat=True))
    if selected_tokens:
        send_raw_push_to_tokens(
            selected_tokens,
            title,
            body,
            data={
                'notification_type': 'exam',
                'related_object_type': 'client_exam',
                'related_object_id': exam.id,
            },
        )
    else:
        tokens = list(DeviceToken.objects.filter(user=exam.user, is_active=True).values_list('token', flat=True))
        send_raw_push_to_tokens(
            tokens,
            title,
            body,
            data={
                'notification_type': 'exam',
                'related_object_type': 'client_exam',
                'related_object_id': exam.id,
            },
        )
    exam.last_reminded_at = now
    setattr(exam, {
        'created': 'creation_notified_at',
        'day_before': 'day_before_notified_at',
        'exam_day': 'exam_day_notified_at',
    }[kind], now)
    exam.next_reminder_at = exam.compute_next_reminder_at(now)
    exam.save(update_fields=[
        'last_reminded_at', 'creation_notified_at', 'day_before_notified_at',
        'exam_day_notified_at', 'next_reminder_at', 'updated_at',
    ])
    return True


def notify_exam_seen(exam: ClientExam):
    callback_url = str(getattr(settings, 'EXAM_SL_CALLBACK_URL', '') or '').rstrip('/')
    api_key = str(getattr(settings, 'EXAM_SL_API_KEY', '') or '')
    if not callback_url or not api_key or not exam.manager_sl_exam_id:
        return False
    try:
        response = requests.post(
            f'{callback_url}/api/internal/exams/{exam.manager_sl_exam_id}/seen/',
            json={'acknowledged_at': exam.acknowledged_at.isoformat() if exam.acknowledged_at else ''},
            headers={'X-API-KEY': api_key},
            timeout=10,
        )
        response.raise_for_status()
        return True
    except requests.RequestException:
        return False


def send_admin_reminder(reminder: AdminReminder, *, test_user=None):
    user = test_user or reminder.owner
    title = reminder.title
    body = reminder.body

    try:
        send_push_to_user(
            user=user,
            title=title,
            body=body,
            notification_type='admin_reminder',
            related_object_type='admin_reminder',
            related_object_id=reminder.id,
        )
    except Exception as exc:
        if test_user is None:
            reminder.status = AdminReminder.Status.FAILED
            reminder.last_error = str(exc)
            reminder.save(update_fields=['status', 'last_error', 'updated_at'])
        raise

    if test_user is None:
        reminder.status = AdminReminder.Status.SENT
        reminder.sent_at = timezone.now()
        reminder.last_error = ''
        reminder.save(update_fields=['status', 'sent_at', 'last_error', 'updated_at'])
    return True
