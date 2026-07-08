from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.notifications.models import AdminReminder
from apps.notifications.services import send_admin_reminder


class Command(BaseCommand):
    help = 'Send pending personal admin reminders.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--limit', type=int, default=200)

    def handle(self, *args, **options):
        now = timezone.now()
        reminders = (
            AdminReminder.objects
            .select_related('owner')
            .filter(
                status=AdminReminder.Status.PENDING,
                remind_at__lte=now,
            )
            .order_by('remind_at')[:options['limit']]
        )
        sent = 0
        for reminder in reminders:
            if options['dry_run']:
                self.stdout.write(
                    f'would_send reminder={reminder.id} owner={reminder.owner_id} title={reminder.title}'
                )
                continue
            try:
                if send_admin_reminder(reminder):
                    sent += 1
            except Exception as exc:
                self.stderr.write(f'failed reminder={reminder.id}: {exc}')
        self.stdout.write(self.style.SUCCESS(f'Admin reminders sent: {sent}'))
