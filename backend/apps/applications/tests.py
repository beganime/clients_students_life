from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class AdmissionStatusTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='SL-2027-000001',
            email='student@example.invalid',
            password='test-password',
        )
        self.api = APIClient()
        self.api.force_authenticate(self.user)

    @patch('apps.applications.views.ManagerSLClient.get_admission_status')
    def test_status_is_requested_for_authenticated_mobile_user_only(self, get_status):
        get_status.return_value = {
            'client': {'sl_id': 'SL-2027-000001', 'full_name': 'Иван Иванов'},
            'results': [{'id': 'app-1', 'stage': 'APPLICATION_SUBMITTED', 'stage_label': 'Заявка подана'}],
        }

        response = self.api.get('/api/v1/applications/admission-status/')

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['results'][0]['stage_label'], 'Заявка подана')
        get_status.assert_called_once_with(self.user.pk)

    def test_status_requires_login(self):
        response = APIClient().get('/api/v1/applications/admission-status/')
        self.assertEqual(response.status_code, 401)
