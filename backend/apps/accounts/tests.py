from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.notifications.models import DeviceToken, UserNotification


User = get_user_model()


@override_settings(MANAGER_SL_PROVISION_TOKEN='manager-provision-token')
class ProvisionClientAccountTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.headers = {'HTTP_AUTHORIZATION': 'Bearer manager-provision-token'}
        self.payload = {
            'sl_id': 'SL-001',
            'password': 'Test_0710',
            'full_name': 'Тестовый Клиент',
            'phone': '+99360000000',
            'fcm_token': 'current-device-token',
        }

    @patch('apps.accounts.views.send_raw_push_to_tokens', return_value=1)
    @patch('apps.accounts.views.provision_akylchat_client')
    def test_provision_creates_both_mobile_and_akylchat_accounts(self, provision_akylchat, send_push):
        provision_akylchat.return_value = {
            'status': 'created',
            'user_uuid': 'user-uuid',
            'chat_uuid': 'chat-uuid',
        }

        response = self.client.post(
            '/api/v1/accounts/internal/provision/',
            self.payload,
            format='json',
            **self.headers,
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['akylchat']['chat_uuid'], 'chat-uuid')
        self.assertTrue(User.objects.get(username='SL-001').check_password('Test_0710'))
        notification = UserNotification.objects.get(notification_type='account_credentials')
        self.assertIn('SL-001', notification.body)
        self.assertIn('Test_0710', notification.body)
        self.assertTrue(DeviceToken.objects.filter(token='current-device-token', user__username='SL-001', is_active=True).exists())
        self.assertEqual(response.data['push_sent'], 1)
        self.assertEqual(send_push.call_args.args[0], ['current-device-token'])
        self.assertIn('SL-001', send_push.call_args.args[2])
        self.assertIn('Test_0710', send_push.call_args.args[2])
        provision_akylchat.assert_called_once()

    @patch('apps.accounts.views.send_push_to_user')
    def test_internal_notification_uses_client_account(self, send_push):
        user = User.objects.create_user(username='SL-002', password='x')
        DeviceToken.objects.create(user=user, token='latest-token', is_active=True)

        response = self.client.post(
            '/api/v1/accounts/internal/notify/',
            {'sl_id': 'SL-002', 'title': 'Аккаунт одобрен', 'body': 'Можно войти'},
            format='json',
            **self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['active_tokens'], 1)
        send_push.assert_called_once()

    @patch('apps.accounts.views.provision_akylchat_client')
    def test_repeated_provision_updates_password_without_duplicate(self, provision_akylchat):
        provision_akylchat.return_value = {'status': 'exists'}
        self.client.post('/api/v1/accounts/internal/provision/', self.payload, format='json', **self.headers)
        updated = {**self.payload, 'password': 'Changed_0710'}

        response = self.client.post(
            '/api/v1/accounts/internal/provision/',
            updated,
            format='json',
            **self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.filter(username='SL-001').count(), 1)
        self.assertTrue(User.objects.get(username='SL-001').check_password('Changed_0710'))
        self.assertEqual(UserNotification.objects.filter(notification_type='account_credentials').count(), 1)
        self.assertIn(
            'Changed_0710',
            UserNotification.objects.get(notification_type='account_credentials').body,
        )
