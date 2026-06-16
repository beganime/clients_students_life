from django.contrib.auth import get_user_model
from django.db.models import Q

from apps.notifications.services import send_push_to_user
from apps.staff.models import StaffProfile


def staff_profile_for(user):
    try:
        return user.staff_profile
    except (AttributeError, StaffProfile.DoesNotExist):
        return None


def manager_recipients(room):
    User = get_user_model()
    recipients = User.objects.none()
    if room.assigned_manager_id and room.assigned_manager.user_id:
        recipients = User.objects.filter(id=room.assigned_manager.user_id)
    else:
        recipients = User.objects.filter(
            Q(is_staff=True)
            | Q(is_superuser=True)
            | Q(client_profile__role__is_manager=True)
        )
    return recipients.distinct()


def notify_chat_message(message):
    room = message.room
    if message.sender_staff_id:
        recipients = [room.user]
        title = 'Новое сообщение от менеджера'
        body = message.text or 'Менеджер отправил фото.'
    else:
        recipients = manager_recipients(room)
        title = 'Новое сообщение клиента'
        body = message.text or 'Клиент отправил фото.'

    for recipient in recipients:
        if message.sender_user_id and recipient.id == message.sender_user_id:
            continue
        send_push_to_user(
            recipient,
            title=title,
            body=body[:180],
            notification_type='chat_message',
            related_object_type='chat_room',
            related_object_id=room.id,
        )
