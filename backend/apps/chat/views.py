import hashlib

from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import is_manager_user
from apps.applications.models import Application

from .services import notify_chat_message, staff_profile_for
from .models import ChatMessage, ChatRoom
from .serializers import ChatMessageCreateSerializer, ChatMessageSerializer, ChatRoomSerializer
from .akyl import AkylChatClient, AkylChatError, provision_akylchat_client


class LocalChatEnabled(permissions.BasePermission):
    message = 'Локальный чат отключён. Используется сервис Akylchat.'

    def has_permission(self, request, view):
        return settings.LOCAL_CHAT_ENABLED or bool(settings.AKYLCHAT_API_BASE_URL and settings.AKYLCHAT_SERVICE_TOKEN)


def akyl_actor(user):
    return 'manager' if is_manager_user(user) else 'client'


def akyl_sl_id(user):
    return str(user.username or '').strip().upper()


def akyl_error_response(exc):
    return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated, LocalChatEnabled]
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    filterset_fields = ('status', 'application')
    ordering_fields = ('created_at', 'updated_at')
    ordering = ('-updated_at',)

    @property
    def use_akylchat(self):
        return not settings.LOCAL_CHAT_ENABLED

    def akyl_client(self):
        return AkylChatClient()

    def akyl_room_context(self, pk=None):
        actor = akyl_actor(self.request.user)
        if actor == 'client':
            return akyl_sl_id(self.request.user), actor
        rooms = self.akyl_client().rooms(actor='manager').get('results', [])
        room = next((item for item in rooms if str(item.get('id')) == str(pk)), None)
        if not room:
            raise AkylChatError('Чат не найден.')
        return str(room.get('sl_id') or '').strip().upper(), actor

    def list(self, request, *args, **kwargs):
        if not self.use_akylchat:
            return super().list(request, *args, **kwargs)
        actor = akyl_actor(request.user)
        try:
            payload = self.akyl_client().rooms(
                sl_id=akyl_sl_id(request.user) if actor == 'client' else '',
                actor=actor,
            )
        except AkylChatError as exc:
            return akyl_error_response(exc)
        return Response({
            'count': payload.get('count', len(payload.get('results', []))),
            'next': None,
            'previous': None,
            'results': payload.get('results', []),
        })

    def get_throttles(self):
        if self.action == 'send_message':
            has_upload = bool(self.request.FILES.get('image') or self.request.FILES.get('file'))
            self.throttle_scope = 'chat_upload' if has_upload else 'chat_message'
        elif self.action == 'create':
            self.throttle_scope = 'chat_message'
        return super().get_throttles()

    def get_queryset(self):
        qs = (
            ChatRoom.objects
            .select_related('user', 'user__app_activity', 'application', 'assigned_manager', 'assigned_manager__user')
            .prefetch_related('messages', 'messages__attachments')
        )
        if is_manager_user(self.request.user):
            return qs
        return qs.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        if self.use_akylchat:
            if is_manager_user(request.user):
                return Response(
                    {'detail': 'Менеджер открывает существующий клиентский чат из списка.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                payload = self.akyl_client().rooms(sl_id=akyl_sl_id(request.user), actor='client')
                if not payload.get('results'):
                    chat_password = hashlib.sha256(
                        f'{settings.SECRET_KEY}:{akyl_sl_id(request.user)}'.encode('utf-8')
                    ).hexdigest()[:32]
                    provision_akylchat_client(
                        sl_id=akyl_sl_id(request.user),
                        password=chat_password,
                        full_name=request.user.get_full_name() or akyl_sl_id(request.user),
                        email=request.user.email or '',
                        phone=getattr(getattr(request.user, 'client_profile', None), 'phone', ''),
                    )
                    payload = self.akyl_client().rooms(sl_id=akyl_sl_id(request.user), actor='client')
            except AkylChatError as exc:
                return akyl_error_response(exc)
            rooms = payload.get('results', [])
            if not rooms:
                return Response(
                    {'detail': 'Чат ещё не создан. Повторите вход или обратитесь к менеджеру.'},
                    status=status.HTTP_409_CONFLICT,
                )
            return Response(rooms[0], status=status.HTTP_201_CREATED)
        application_id = request.data.get('application')
        if is_manager_user(request.user):
            return Response(
                {'detail': 'Менеджер открывает существующий клиентский чат из списка.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application = self.get_user_application(application_id)
        if application_id not in (None, '') and application is None:
            return Response({'detail': 'Р—Р°СЏРІРєР° РЅРµ РЅР°Р№РґРµРЅР°.'}, status=status.HTTP_404_NOT_FOUND)

        filters = {'user': request.user, 'status': ChatRoom.Status.OPEN}
        filters['application'] = application
        room = ChatRoom.objects.filter(**filters).order_by('-updated_at').first()
        if not room:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            room = serializer.save(user=request.user, application=application)
        response_serializer = self.get_serializer(room)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def get_user_application(self, application_id):
        if application_id in (None, ''):
            return None
        try:
            application_id = int(application_id)
        except (TypeError, ValueError):
            return None
        return Application.objects.filter(id=application_id, user=self.request.user).first()

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        if self.use_akylchat:
            try:
                sl_id, actor = self.akyl_room_context(pk)
                payload = self.akyl_client().messages(sl_id, actor=actor)
            except AkylChatError as exc:
                return akyl_error_response(exc)
            return Response({
                'count': payload.get('count', len(payload.get('results', []))),
                'next': None,
                'previous': None,
                'results': payload.get('results', []),
            })
        room = self.get_object()
        messages = (
            room.messages
            .select_related('sender_user', 'sender_staff')
            .prefetch_related('attachments')
            .order_by('created_at')
        )
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = ChatMessageSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        if self.use_akylchat:
            try:
                sl_id, actor = self.akyl_room_context(pk)
                upload_field = 'image' if request.FILES.get('image') else 'file'
                upload = request.FILES.get(upload_field)
                message = self.akyl_client().send_message(
                    sl_id,
                    actor=actor,
                    text=str(request.data.get('text') or '').strip(),
                    upload=upload,
                    upload_field=upload_field,
                    manager_name=(request.user.get_full_name() or request.user.username) if actor == 'manager' else '',
                )
            except AkylChatError as exc:
                return akyl_error_response(exc)
            return Response(message, status=status.HTTP_201_CREATED)
        room = self.get_object()
        if room.status != ChatRoom.Status.OPEN:
            return Response({'detail': 'Чат закрыт.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ChatMessageCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        sender_staff = staff_profile_for(request.user) if is_manager_user(request.user) else None
        message = serializer.create_message(
            room=room,
            sender_user=request.user,
            sender_staff=sender_staff,
        )
        if sender_staff and not room.assigned_manager_id:
            room.assigned_manager = sender_staff
        room.save(update_fields=['assigned_manager', 'updated_at'] if sender_staff else ['updated_at'])
        notify_chat_message(message)
        response_serializer = ChatMessageSerializer(message, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        if self.use_akylchat:
            try:
                sl_id, actor = self.akyl_room_context(pk)
                payload = self.akyl_client().mark_read(sl_id, actor=actor)
            except AkylChatError as exc:
                return akyl_error_response(exc)
            return Response(payload)
        room = self.get_object()
        room.messages.exclude(sender_user=request.user).update(is_read=True)
        return Response({'status': 'ok'})


class ChatMessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated, LocalChatEnabled]

    def get_queryset(self):
        qs = ChatMessage.objects.select_related('room', 'sender_user', 'sender_staff')
        if is_manager_user(self.request.user):
            return qs
        return qs.filter(room__user=self.request.user)
