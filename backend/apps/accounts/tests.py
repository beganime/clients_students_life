from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from datetime import timedelta
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

    @patch('apps.accounts.views.provision_akylchat_client')
    @patch('apps.accounts.views.send_raw_push_to_tokens')
    def test_create_only_does_not_reset_existing_password(self, push, chat):
        user = User.objects.create_user(username='SL-001', password='Original-test-password')
        response = self.client.post('/api/v1/accounts/internal/provision/',
            {**self.payload, 'create_only': True}, format='json', **self.headers)
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password('Original-test-password'))
        push.assert_not_called()
        chat.assert_not_called()

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
        self.assertEqual(notification.title, 'Аккаунт одобрен')
        self.assertNotIn('Test_0710', notification.body)
        self.assertTrue(DeviceToken.objects.filter(token='current-device-token', user__username='SL-001', is_active=True).exists())
        self.assertEqual(response.data['push_sent'], 1)
        self.assertEqual(send_push.call_args.args[0], ['current-device-token'])
        self.assertIn('приложение', send_push.call_args.args[2].lower())
        self.assertNotIn('Test_0710', send_push.call_args.args[2])
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

    @patch('apps.accounts.views.send_push_to_user')
    def test_bulk_notification_can_target_selected_clients(self, send_push):
        User.objects.create_user(username='SL-010', password='x')
        User.objects.create_user(username='SL-011', password='x')

        response = self.client.post(
            '/api/v1/accounts/internal/notify-bulk/',
            {'sl_ids': ['SL-010', 'SL-011'], 'title': 'Важное сообщение', 'body': 'Проверьте анкету'},
            format='json', **self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['recipients'], 2)
        self.assertEqual(send_push.call_count, 2)

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
        self.assertNotIn('Changed_0710', UserNotification.objects.get(notification_type='account_credentials').body)

    @patch('apps.accounts.views.send_raw_push_to_tokens', return_value=0)
    @patch('apps.accounts.views.provision_akylchat_client', return_value={'status': 'created'})
    def test_secure_provision_uses_remote_one_time_activation(self, _chat, _push):
        token = 'private-onboarding-token'
        payload = {
            **self.payload,
            'password': '',
            'activation_mode': 'onboarding_token',
            'onboarding_public_id': '5a04182d-97ea-4221-9f43-d4e2cc62a125',
            'onboarding_access_token': token,
        }
        response = self.client.post(
            '/api/v1/accounts/internal/provision/', payload, format='json', **self.headers,
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username='SL-001')
        profile = user.client_profile
        self.assertFalse(user.has_usable_password())
        self.assertEqual(profile.onboarding_access_token, '')
        with patch('apps.accounts.views.ManagerSLClient.from_settings') as manager:
            manager.return_value.request_json.return_value = {
                'status': 'approved', 'sl_id': 'SL-001',
            }
            activation = self.client.post(
                '/api/v1/accounts/activate-onboarding/',
                {'public_id': profile.onboarding_public_id, 'access_token': token},
                format='json',
            )
        self.assertEqual(activation.status_code, 200)
        self.assertTrue(activation.data['access'])
        self.assertTrue(activation.data['refresh'])
        profile.refresh_from_db()
        self.assertIsNotNone(profile.onboarding_activated_at)

    @patch('apps.accounts.views.send_raw_push_to_tokens', return_value=0)
    @patch('apps.accounts.views.provision_akylchat_client', return_value={'status': 'created'})
    def test_activation_rejects_wrong_and_consumed_token(self, _chat, _push):
        token = 'private-onboarding-token'
        public_id = '5a04182d-97ea-4221-9f43-d4e2cc62a125'
        self.client.post(
            '/api/v1/accounts/internal/provision/',
            {
                **self.payload,
                'password': '',
                'activation_mode': 'onboarding_token',
                'onboarding_public_id': public_id,
                'onboarding_access_token': token,
            },
            format='json', **self.headers,
        )
        with patch('apps.accounts.views.ManagerSLClient.from_settings') as manager:
            manager.return_value.request_json.return_value = {
                'status': 'approved', 'sl_id': 'SL-999',
            }
            wrong = self.client.post(
                '/api/v1/accounts/activate-onboarding/',
                {'public_id': public_id, 'access_token': 'wrong-token'}, format='json',
            )
        self.assertEqual(wrong.status_code, 403)

        profile = User.objects.get(username='SL-001').client_profile
        profile.onboarding_activated_at = timezone.now() - timedelta(minutes=6)
        profile.save(update_fields=['onboarding_activated_at'])
        consumed = self.client.post(
            '/api/v1/accounts/activate-onboarding/',
            {'public_id': public_id, 'access_token': token}, format='json',
        )
        self.assertEqual(consumed.status_code, 409)

    def test_me_creates_only_one_monthly_location_reminder(self):
        user = User.objects.create_user(username='SL-020', password='x')
        self.client.force_authenticate(user)

        first = self.client.get('/api/v1/accounts/me/')
        second = self.client.get('/api/v1/accounts/me/')

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(
            UserNotification.objects.filter(user=user, notification_type='current_location_reminder').count(),
            1,
        )

    def test_location_update_is_saved_in_action_history(self):
        user = User.objects.create_user(username='SL-021', password='x')
        self.client.force_authenticate(user)

        response = self.client.patch(
            '/api/v1/accounts/me/',
            {'current_location': 'Казань'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        user.client_profile.refresh_from_db()
        self.assertEqual(user.client_profile.current_location, 'Казань')
        self.assertTrue(user.client_profile.location_updated_at)
        self.assertTrue(
            UserNotification.objects.filter(user=user, notification_type='profile_location_updated').exists()
        )
