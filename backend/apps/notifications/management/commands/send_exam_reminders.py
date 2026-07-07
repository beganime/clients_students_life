from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.notifications.models import ClientExam
from apps.notifications.services import send_exam_reminder


class Command(BaseCommand):
    help = 'Send pending client exam reminders.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--limit', type=int, default=200)

    def handle(self, *args, **options):
        now = timezone.now()
        exams = (
            ClientExam.objects
            .select_related('user')
            .filter(
                is_active=True,
                acknowledged_by_user=False,
                next_reminder_at__isnull=False,
                next_reminder_at__lte=now,
            )
            .order_by('next_reminder_at')[:options['limit']]
        )
        sent = 0
        for exam in exams:
            if options['dry_run']:
                self.stdout.write(f'would_send exam={exam.id} user={exam.user_id} subject={exam.subject}')
                continue
            if send_exam_reminder(exam, force=True):
                sent += 1
        self.stdout.write(self.style.SUCCESS(f'Exam reminders sent: {sent}'))
