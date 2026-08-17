from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.notifications.models import DeviceToken, UserNotification

from .models import DeveloperRequest


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


class DeveloperPageTests(TestCase):
    def test_turkmen_page_and_form_are_available(self):
        response = self.client.get('/developer/?lang=tk')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Işiňiz üçin web sahypa')
        self.assertContains(response, '3 gün')
        self.assertContains(response, 'name="language" value="tk"')

    def test_developer_contacts_are_rendered_as_links(self):
        from .models import AppSetting

        AppSetting.objects.create(key='developer_telegram', value='@beganime')
        AppSetting.objects.create(key='developer_instagram', value='beganime4')
        AppSetting.objects.create(key='developer_phone', value='+99363995579 / +99371947297')
        AppSetting.objects.create(
            key='developer_email',
            value='begenchyagmurow2008@gmail.com / admin@tmmail.ru / begenchyagmurow@mail.ru',
        )

        response = self.client.get('/developer/')

        self.assertContains(response, 'https://t.me/beganime')
        self.assertContains(response, 'https://instagram.com/beganime4')
        self.assertContains(response, 'tel:+99363995579')
        self.assertContains(response, 'mailto:admin@tmmail.ru')

    @patch('apps.common.views.send_raw_push_to_tokens', return_value=1)
    def test_request_is_saved_and_pushes_latest_active_device(self, send_push):
        user = get_user_model().objects.create_user(
            username='developer-notification-user',
            email='begenchyagmurow2008@gmail.com',
            password='test-only-password',
        )
        DeviceToken.objects.create(user=user, token='current-developer-device-token', is_active=True)

        response = self.client.post('/developer/', {
            'language': 'ru',
            'name': 'Тестовая компания',
            'contact': '@test_contact',
            'contact_method': 'telegram',
            'project_type': 'website',
            'budget': 'по договорённости',
            'timeline': '7 дней',
            'message': 'Нужен тестовый сайт',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(DeveloperRequest.objects.count(), 1)
        self.assertTrue(UserNotification.objects.filter(user=user, notification_type='developer_request').exists())
        send_push.assert_called_once()
        self.assertEqual(send_push.call_args.args[0], ['current-developer-device-token'])


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
