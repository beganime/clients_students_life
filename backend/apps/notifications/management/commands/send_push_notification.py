from django.core.management.base import BaseCommand, CommandError

from apps.notifications.models import PushNotification
from apps.notifications.services import send_push_notification


class Command(BaseCommand):
    help = 'Send one prepared push notification by id.'

    def add_arguments(self, parser):
        parser.add_argument('notification_id', type=int)

    def handle(self, *args, **options):
        notification = PushNotification.objects.filter(pk=options['notification_id']).first()
        if not notification:
            raise CommandError('PushNotification not found.')
        result = send_push_notification(notification)
        self.stdout.write(self.style.SUCCESS(
            f'Sent notification {notification.id}. '
            f'Internal: {result["internal_created"]}; FCM pushes: {result["push_sent"]}.'
        ))
