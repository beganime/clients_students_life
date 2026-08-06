from django.test import TestCase, override_settings
from django.urls import reverse


class DeploymentReadinessTests(TestCase):
    def test_health_checks_database_and_feature_flags(self):
        response = self.client.get(reverse('health'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')
        self.assertEqual(response.json()['storage'], 'local')

    @override_settings(PUBLIC_REGISTRATION_ENABLED=False)
    def test_public_registration_is_disabled(self):
        response = self.client.post(
            reverse('register'),
            data={
                'username': 'public-user',
                'email': 'public@example.com',
                'password': 'unsafe-public-password',
            },
        )

        self.assertEqual(response.status_code, 403)


@override_settings(MANAGER_SL_PROVISION_TOKEN='manager-token')
class AccountProvisionTests(TestCase):
    def provision(self, token='manager-token'):
        return self.client.post(
            '/api/v1/accounts/internal/provision/',
            {
                'sl_id': 'SL-2027-001',
                'password': 'Ivan_0710',
                'full_name': 'Иван Иванов',
                'phone': '+99361111111',
            },
            content_type='application/json',
            headers={'Authorization': f'Bearer {token}'},
        )

    def test_manager_can_provision_account_idempotently(self):
        first = self.provision()
        second = self.provision()

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.json()['sl_id'], 'SL-2027-001')

    def test_provision_requires_service_token(self):
        self.assertEqual(self.provision('wrong').status_code, 401)
