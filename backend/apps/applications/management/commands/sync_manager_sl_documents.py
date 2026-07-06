from django.core.management.base import BaseCommand, CommandError

from apps.common.manager_sl import ManagerSLClient
from apps.applications.manager_sl_sync import (
    build_manager_sl_document_payload,
    sync_application_file_to_manager_sl,
)
from apps.applications.models import ApplicationFile


class Command(BaseCommand):
    help = 'Sync uploaded application files from the mobile backend to manager-sl client documents.'

    def add_arguments(self, parser):
        parser.add_argument('--application-id', type=int, help='Sync files only for one mobile application ID.')
        parser.add_argument('--user-id', type=int, help='Sync files only for one mobile user ID.')
        parser.add_argument('--limit', type=int, default=0, help='Maximum number of files to sync. 0 means no limit.')
        parser.add_argument('--base-url', default='', help='Public base URL of this mobile backend, e.g. https://stud-life.com')
        parser.add_argument('--dry-run', action='store_true', help='Build payloads without sending them to manager-sl.')

    def handle(self, *args, **options):
        client = ManagerSLClient.from_settings()
        if not client.is_configured:
            raise CommandError('MANAGER_SL_API_BASE_URL is not configured.')
        if not client.api_key:
            raise CommandError('MANAGER_SL_LEADS_API_KEY is not configured.')

        qs = ApplicationFile.objects.select_related(
            'application',
            'application__user',
            'application__service',
            'uploaded_by',
        ).order_by('created_at', 'id')

        if options['application_id']:
            qs = qs.filter(application_id=options['application_id'])
        if options['user_id']:
            qs = qs.filter(application__user_id=options['user_id'])
        if options['limit']:
            qs = qs[:options['limit']]

        total = success = failed = skipped = 0
        for application_file in qs:
            total += 1
            if options['dry_run']:
                payload = build_manager_sl_document_payload(
                    application_file,
                    public_base_url=options['base_url'],
                )
                self.stdout.write(
                    self.style.NOTICE(
                        f'DRY RUN file={application_file.id} title={payload.get("title")} url={payload.get("file_url")}'
                    )
                )
                skipped += 1
                continue

            result = sync_application_file_to_manager_sl(
                application_file,
                public_base_url=options['base_url'],
            )
            status = result.get('status')
            if status == 'synced':
                success += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Synced file={application_file.id} manager_document={result.get("manager_sl_document_id")}'
                    )
                )
            elif status == 'skipped':
                skipped += 1
                self.stdout.write(self.style.WARNING(f'Skipped file={application_file.id}: {result.get("detail")}'))
            else:
                failed += 1
                self.stdout.write(self.style.ERROR(f'Failed file={application_file.id}: {result.get("detail")}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. total={total}, synced={success}, failed={failed}, skipped={skipped}'
            )
        )
