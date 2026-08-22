from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import RequiredDocumentType, UserDocument


class MyDocumentsApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='SL-2027-999', password='test-password')
        self.document_type = RequiredDocumentType.objects.create(
            title='Заграничный паспорт',
            description='Основной разворот',
            is_required=True,
            sort_order=10,
        )
        self.client.force_authenticate(self.user)

    def test_list_includes_not_uploaded_required_type(self):
        response = self.client.get('/api/v1/documents/my-documents/')

        self.assertEqual(response.status_code, 200)
        row = next(item for item in response.data if item['id'] == self.document_type.id)
        self.assertEqual(row['title'], 'Заграничный паспорт')
        self.assertEqual(row['status'], UserDocument.Status.NOT_UPLOADED)

    @override_settings(APPLICATION_FILE_MAX_UPLOAD_SIZE=50 * 1024 * 1024)
    @patch('apps.documents.views.upload_user_document_to_manager_sl')
    def test_upload_marks_document_pending_without_local_file(self, upload_mock):
        def save_disk_metadata(document, uploaded_file):
            document.disk_path = '2027/Контракт/Test (SL-2027-999)/оригиналы/passport.pdf'
            document.disk_folder_url = 'https://disk.manager-sl.ru/web/client/files?path=%2Ftest'
            document.manager_sl_document_id = '55'
            document.save()
            return {'id': 55}

        upload_mock.side_effect = save_disk_metadata
        file = SimpleUploadedFile('passport.pdf', b'%PDF-1.4\n%%EOF', content_type='application/pdf')

        response = self.client.post(
            f'/api/v1/documents/my-documents/{self.document_type.id}/upload/',
            {'file': file},
            format='multipart',
        )

        self.assertEqual(response.status_code, 200)
        document = UserDocument.objects.get(user=self.user, document_type=self.document_type)
        self.assertEqual(document.status, UserDocument.Status.PENDING)
        self.assertFalse(bool(document.file))
        self.assertTrue(document.disk_path.endswith('/passport.pdf'))
        self.assertIsNone(response.data['file'])

    def test_invalid_pdf_is_rejected_before_disk_upload(self):
        file = SimpleUploadedFile('passport.pdf', b'not-a-pdf', content_type='application/pdf')

        response = self.client.post(
            f'/api/v1/documents/my-documents/{self.document_type.id}/upload/',
            {'file': file},
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(UserDocument.objects.filter(user=self.user).exists())
