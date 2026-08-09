from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


User = get_user_model()


@override_settings(
    LOCAL_CHAT_ENABLED=False,
    AKYLCHAT_API_BASE_URL='https://akyl.test/api/v1',
    AKYLCHAT_SERVICE_TOKEN='akyl-service-token',
)
class AkylChatProxyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='SL-001', password='Test_0710')
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.room = {
            'id': 'chat-uuid',
            'sl_id': 'SL-001',
            'user_name': 'Тестовый Клиент',
            'status': 'open',
            'last_message': None,
            'unread_count': 0,
            'created_at': '2026-08-08T00:00:00Z',
            'updated_at': '2026-08-08T00:00:00Z',
        }

    @patch('apps.chat.views.AkylChatClient.rooms')
    def test_room_list_comes_from_akylchat(self, rooms):
        rooms.return_value = {'count': 1, 'results': [self.room]}

        response = self.client.get('/api/v1/chat/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['id'], 'chat-uuid')
        rooms.assert_called_once_with(sl_id='SL-001', actor='client')

    @patch('apps.chat.views.AkylChatClient.send_message')
    def test_message_is_sent_to_akylchat(self, send_message):
        send_message.return_value = {
            'id': 'message-uuid',
            'room': 'chat-uuid',
            'message_type': 'text',
            'text': 'Здравствуйте',
            'is_mine': True,
            'is_read': False,
            'created_at': '2026-08-08T00:00:00Z',
        }

        response = self.client.post(
            '/api/v1/chat/chat-uuid/send_message/',
            {'text': 'Здравствуйте'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['id'], 'message-uuid')
        send_message.assert_called_once()

    @patch('apps.chat.views.provision_akylchat_client')
    @patch('apps.chat.views.AkylChatClient.rooms')
    def test_create_self_heals_missing_support_chat(self, rooms, provision):
        rooms.side_effect = [
            {'count': 0, 'results': []},
            {'count': 1, 'results': [self.room]},
        ]
        provision.return_value = {'status': 'created'}

        response = self.client.post('/api/v1/chat/', {'application': None}, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['id'], 'chat-uuid')
        provision.assert_called_once()
