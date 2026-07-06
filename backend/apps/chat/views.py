from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import is_manager_user
from apps.applications.models import Application

from .services import notify_chat_message, staff_profile_for
from .models import ChatMessage, ChatRoom
from .serializers import ChatMessageCreateSerializer, ChatMessageSerializer, ChatRoomSerializer


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    filterset_fields = ('status', 'application')
    ordering_fields = ('created_at', 'updated_at')
    ordering = ('-updated_at',)

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
        room = self.get_object()
        room.messages.exclude(sender_user=request.user).update(is_read=True)
        return Response({'status': 'ok'})


class ChatMessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ChatMessage.objects.select_related('room', 'sender_user', 'sender_staff')
        if is_manager_user(self.request.user):
            return qs
        return qs.filter(room__user=self.request.user)
