import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import ChatMessage, ChatRoom


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        has_access = await self.check_room_access()
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        data = json.loads(text_data)
        message_text = data.get('text', '').strip()

        if not message_text:
            return

        message = await self.create_message(message_text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message['id'],
                    'room': self.room_id,
                    'text': message['text'],
                    'sender_user': message['sender_user'],
                    'sender_staff': message['sender_staff'],
                    'created_at': message['created_at'],
                },
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def check_room_access(self):
        try:
            room = ChatRoom.objects.select_related('user').get(id=self.room_id)
        except ChatRoom.DoesNotExist:
            return False

        if self.user.is_staff:
            return True

        return room.user_id == self.user.id

    @database_sync_to_async
    def create_message(self, text):
        room = ChatRoom.objects.get(id=self.room_id)
        message = ChatMessage.objects.create(
            room=room,
            sender_user=self.user,
            message_type=ChatMessage.MessageType.TEXT,
            text=text,
        )
        room.save()

        return {
            'id': message.id,
            'text': message.text,
            'sender_user': message.sender_user_id,
            'sender_staff': None,
            'created_at': message.created_at.isoformat(),
        }