from unittest.mock import patch, Mock
from django.test import TestCase
from .models import DeviceToken
from .services import send_raw_push_to_tokens
from .expo_push import send_expo


class ExpoPushTests(TestCase):
    @patch('apps.notifications.services.send_expo', return_value=(True, False))
    @patch('apps.notifications.services.init_firebase')
    def test_expo_does_not_require_firebase(self, firebase, expo):
        self.assertEqual(send_raw_push_to_tokens(['ExpoPushToken[test]'], 'Title', 'Body'), 1)
        firebase.assert_not_called()

    @patch('apps.notifications.services.send_expo', side_effect=TimeoutError)
    def test_temporary_failure_keeps_device(self, expo):
        device = DeviceToken.objects.create(token='ExpoPushToken[test]', is_active=True)
        self.assertEqual(send_raw_push_to_tokens([device.token], 'Title', 'Body'), 0)
        device.refresh_from_db()
        self.assertTrue(device.is_active)

    @patch('apps.notifications.services.send_expo', return_value=(False, True))
    def test_unregistered_device_disabled(self, expo):
        device = DeviceToken.objects.create(token='ExpoPushToken[test]', is_active=True)
        send_raw_push_to_tokens([device.token], 'Title', 'Body')
        device.refresh_from_db()
        self.assertFalse(device.is_active)

    @patch('apps.notifications.expo_push.requests.post')
    def test_ticket_not_delivery(self, post):
        post.return_value = Mock(json=lambda: {'data': {'status': 'ok', 'id': 'test-ticket'}})
        self.assertEqual(send_expo('ExpoPushToken[test]', 'Title', 'Body'), (True, False))
        self.assertEqual(post.call_args.kwargs['timeout'], (5, 15))
