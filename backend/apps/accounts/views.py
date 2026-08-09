import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser

from apps.documents.views import has_manager_or_service_access
from apps.chat.akyl import AkylChatError, provision_akylchat_client
from apps.notifications.models import DeviceToken, UserNotification
from apps.notifications.services import send_push_to_user, send_raw_push_to_tokens

from .models import AppRole, AppUserActivity, ClientProfile, ensure_client_profile
from .manager_sl_sync import sync_mobile_client_to_manager_sl
from .serializers import (
    ClientProfileAdminSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserListSerializer,
    UserMeSerializer,
)

User = get_user_model()


def clean_device_value(value, max_length=255):
    return str(value or '').strip()[:max_length]


def has_provision_access(request):
    expected = settings.MANAGER_SL_PROVISION_TOKEN
    supplied = request.headers.get('Authorization', '')
    supplied = supplied[7:].strip() if supplied.startswith('Bearer ') else ''
    return bool(expected and supplied and secrets.compare_digest(expected, supplied))


def normalize_me_payload(data):
    user_fields = ('email', 'first_name', 'last_name')
    profile_fields = ('phone', 'whatsapp', 'telegram', 'country', 'city', 'citizenship', 'avatar', 'language', 'current_location')
    payload = {}

    for field in user_fields:
        if field in data:
            payload[field] = data.get(field)

    profile_data = {}
    raw_profile = data.get('profile') if hasattr(data, 'get') else None
    if isinstance(raw_profile, dict):
        profile_data.update(raw_profile)

    for field in profile_fields:
        if field in data:
            profile_data[field] = data.get(field)
        dotted = f'profile.{field}'
        if dotted in data:
            profile_data[field] = data.get(dotted)

    if profile_data:
        payload['profile'] = profile_data

    return payload or data


def ensure_current_location_reminder(user):
    profile = ensure_client_profile(user)
    reminder_after = timezone.now() - timedelta(days=30)
    location_is_stale = (
        not profile.current_location
        or not profile.location_updated_at
        or profile.location_updated_at < reminder_after
    )
    already_reminded = UserNotification.objects.filter(
        user=user,
        notification_type='current_location_reminder',
        created_at__gte=reminder_after,
    ).exists()
    if location_is_stale and not already_reminded:
        send_push_to_user(
            user,
            'Обновите местоположение',
            'Укажите, где вы сейчас находитесь. Обновляйте эти данные раз в месяц и после каждой поездки.',
            notification_type='current_location_reminder',
            related_object_type='client_profile',
            related_object_id=profile.pk,
        )


def ensure_manager_role(user):
    manager_role, _ = AppRole.objects.get_or_create(
        code=AppRole.MANAGER,
        defaults={
            'name': 'Manager',
            'description': 'Mobile staff role for applications and chat.',
            'is_manager': True,
        },
    )
    if not manager_role.is_manager:
        manager_role.is_manager = True
        manager_role.save(update_fields=['is_manager', 'updated_at'])

    profile = ensure_client_profile(user)
    profile.role = manager_role
    profile.save(update_fields=['role', 'updated_at'])
    return profile


class LoginView(TokenObtainPairView):
    throttle_scope = 'login'
    serializer_class = LoginSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        if not settings.PUBLIC_REGISTRATION_ENABLED:
            return Response(
                {
                    'detail': (
                        'Публичная регистрация отключена. Заполните анкету; '
                        'аккаунт будет создан после подтверждения менеджером.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        sync_mobile_client_to_manager_sl(user)
        response_serializer = UserMeSerializer(user, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProvisionClientAccountView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not has_provision_access(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_401_UNAUTHORIZED)

        sl_id = str(request.data.get('sl_id') or '').strip().upper()
        password = str(request.data.get('password') or '')
        full_name = str(request.data.get('full_name') or '').strip()
        email = str(request.data.get('email') or '').strip().casefold()
        phone = str(request.data.get('phone') or '').strip()
        fcm_token = str(request.data.get('fcm_token') or '').strip()
        onboarding_public_id = str(request.data.get('onboarding_public_id') or '').strip()
        onboarding_access_token = str(request.data.get('onboarding_access_token') or '').strip()
        onboarding_kind = str(request.data.get('onboarding_kind') or 'applicant').strip()
        if not sl_id or len(sl_id) > 32 or not sl_id.startswith('SL-'):
            return Response({'detail': 'A valid sl_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) > 128:
            return Response({'detail': 'A valid password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not full_name or len(full_name) > 255:
            return Response({'detail': 'A valid full_name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        parts = full_name.split(maxsplit=1)
        defaults = {
            'first_name': parts[0],
            'last_name': parts[1] if len(parts) > 1 else '',
            'email': email,
            'is_active': True,
        }
        with transaction.atomic():
            user, created = User.objects.select_for_update().get_or_create(username=sl_id, defaults=defaults)
            user.set_password(password)
            user.save(update_fields=['password'])
            profile = ensure_client_profile(user)
            if phone and profile.phone != phone:
                profile.phone = phone
            if onboarding_public_id:
                profile.onboarding_public_id = onboarding_public_id
            if onboarding_access_token:
                profile.onboarding_access_token = onboarding_access_token
            profile.onboarding_kind = onboarding_kind
            profile.save(update_fields=[
                'phone', 'onboarding_public_id', 'onboarding_access_token',
                'onboarding_kind', 'updated_at',
            ])
            UserNotification.objects.update_or_create(
                user=user,
                notification_type='account_credentials',
                related_object_type='account',
                related_object_id=user.pk,
                defaults={
                    'title': 'Данные для входа',
                    'body': f'Ваш логин: {sl_id}\nВаш пароль: {password}',
                    'is_read': False,
                },
            )
            if fcm_token:
                DeviceToken.objects.update_or_create(
                    token=fcm_token,
                    defaults={'user': user, 'is_active': True},
                )

        credential_body = f'Ваш логин: {sl_id}\nВаш пароль: {password}'
        active_tokens = list(
            DeviceToken.objects.filter(user=user, is_active=True).values_list('token', flat=True)
        )
        push_sent = send_raw_push_to_tokens(
            active_tokens,
            'Аккаунт одобрен',
            credential_body,
            data={
                'notification_type': 'account_credentials',
                'related_object_type': 'account',
                'related_object_id': user.pk,
            },
        )

        try:
            akylchat = provision_akylchat_client(
                sl_id=sl_id,
                password=password,
                full_name=full_name,
                email=email,
                phone=phone,
            )
        except AkylChatError as exc:
            return Response(
                {
                    'detail': 'Mobile account was created, but Akylchat provisioning failed.',
                    'akylchat_error': str(exc),
                    'sl_id': sl_id,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                'status': 'created' if created else 'exists',
                'user_id': user.pk,
                'sl_id': user.username,
                'akylchat': akylchat,
                'push_sent': push_sent,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class InternalClientNotificationView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not has_provision_access(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_401_UNAUTHORIZED)
        sl_id = str(request.data.get('sl_id') or '').strip().upper()
        title = str(request.data.get('title') or '').strip()
        body = str(request.data.get('body') or '').strip()
        if not sl_id or not title or not body:
            return Response({'detail': 'sl_id, title and body are required.'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(username=sl_id, is_active=True).first()
        if not user:
            return Response({'detail': 'Client account not found.'}, status=status.HTTP_404_NOT_FOUND)
        active_tokens = DeviceToken.objects.filter(user=user, is_active=True).count()
        send_push_to_user(
            user, title, body,
            notification_type=str(request.data.get('notification_type') or 'onboarding_status'),
            related_object_type='onboarding',
        )
        return Response({'status': 'sent', 'active_tokens': active_tokens})


class InternalBulkClientNotificationView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not has_provision_access(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_401_UNAUTHORIZED)
        title = str(request.data.get('title') or '').strip()
        body = str(request.data.get('body') or '').strip()
        sl_ids = [str(value).strip().upper() for value in (request.data.get('sl_ids') or []) if str(value).strip()]
        target_all = bool(request.data.get('target_all'))
        if not title or not body or (not target_all and not sl_ids):
            return Response({'detail': 'title, body and recipients are required.'}, status=status.HTTP_400_BAD_REQUEST)
        users = User.objects.filter(is_active=True, username__startswith='SL-')
        if not target_all:
            users = users.filter(username__in=sl_ids)
        sent = 0
        active_tokens = 0
        for user in users.iterator():
            active_tokens += DeviceToken.objects.filter(user=user, is_active=True).count()
            send_push_to_user(user, title, body, notification_type='manager_message', related_object_type='manager_sl')
            sent += 1
        return Response({'status': 'sent', 'recipients': sent, 'active_tokens': active_tokens})


class StaffLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.user

        staff_profile = getattr(user, 'staff_profile', None)
        if not staff_profile:
            return Response(
                {'detail': 'Staff profile is required for employee login.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not getattr(staff_profile, 'is_active', True):
            return Response(
                {'detail': 'Staff profile is inactive.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        ensure_manager_role(user)
        user_data = UserMeSerializer(user, context={'request': request}).data
        return Response({**serializer.validated_data, 'user': user_data}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        ensure_client_profile(request.user)
        if str(request.user.username or '').upper().startswith('SL-'):
            ensure_current_location_reminder(request.user)
        serializer = UserMeSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserMeSerializer(
            request.user,
            data=normalize_me_payload(request.data),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        previous_location = getattr(getattr(request.user, 'client_profile', None), 'current_location', '')
        user = serializer.save()
        sync_mobile_client_to_manager_sl(user)
        profile = ClientProfile.objects.filter(user=user).first()
        if profile and profile.current_location and profile.current_location != previous_location:
            UserNotification.objects.create(
                user=user,
                title='Местоположение обновлено',
                body=f'Текущее местоположение: {profile.current_location}',
                notification_type='profile_location_updated',
                related_object_type='client_profile',
                related_object_id=profile.pk,
                is_read=True,
            )
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token обязателен.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({'detail': 'Некорректный refresh token.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Выход выполнен.'}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        refresh_token = request.data.get('refresh')

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        profile = getattr(user, 'client_profile', None)
        if profile and getattr(profile, 'avatar', None):
            try:
                profile.avatar.delete(save=False)
            except Exception:
                pass

        questionnaire = getattr(user, 'applicant_questionnaire', None)
        if questionnaire:
            for file_field in ('face_photo', 'generated_document'):
                field = getattr(questionnaire, file_field, None)
                if field:
                    try:
                        field.delete(save=False)
                    except Exception:
                        pass

        user.delete()
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_200_OK)


class ActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'activity'

    def post(self, request):
        state = str(request.data.get('state') or request.data.get('status') or '').lower()
        is_online = request.data.get('is_online')
        if is_online is None:
            is_online = state in {'active', 'online', 'opened', 'foreground'}
        is_online = bool(is_online)

        now = timezone.now()
        activity, _ = AppUserActivity.objects.get_or_create(user=request.user)
        activity.is_online = is_online
        activity.last_seen = now
        if is_online:
            activity.last_active_at = now
        activity.device_platform = clean_device_value(
            request.data.get('device_platform') or request.headers.get('X-Device-Platform'),
            40,
        )
        activity.device_id = clean_device_value(request.data.get('device_id'), 255)
        activity.app_version = clean_device_value(request.data.get('app_version'), 80)
        activity.save(
            update_fields=[
                'is_online',
                'last_seen',
                'last_active_at',
                'device_platform',
                'device_id',
                'app_version',
                'updated_at',
            ],
        )
        return Response({
            'is_online': activity.is_online,
            'last_seen': activity.last_seen,
            'last_active_at': activity.last_active_at,
        })


class ManagerDataPagination(PageNumberPagination):
    page_size_query_param = 'limit'
    max_page_size = 200


class ManagerUsersListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    pagination_class = ManagerDataPagination

    def get_queryset(self):
        queryset = User.objects.select_related('client_profile', 'client_profile__role').order_by('-date_joined')
        search = str(self.request.query_params.get('search') or '').strip()
        role = str(self.request.query_params.get('role') or '').strip().lower()
        is_manager = str(self.request.query_params.get('is_manager') or '').strip().lower()

        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(client_profile__phone__icontains=search)
                | Q(client_profile__whatsapp__icontains=search)
                | Q(client_profile__telegram__icontains=search)
            )

        if role:
            queryset = queryset.filter(client_profile__role__code=role)

        if is_manager in {'true', '1', 'yes'}:
            queryset = queryset.filter(Q(is_staff=True) | Q(client_profile__role__is_manager=True))
        elif is_manager in {'false', '0', 'no'}:
            queryset = queryset.exclude(Q(is_staff=True) | Q(client_profile__role__is_manager=True))

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)


class ManagerUserDetailView(generics.RetrieveAPIView):
    serializer_class = UserListSerializer
    lookup_url_kwarg = 'user_id'

    def get_queryset(self):
        return User.objects.select_related('client_profile', 'client_profile__role')

    def retrieve(self, request, *args, **kwargs):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)


class ManagerClientProfileListView(generics.ListAPIView):
    serializer_class = ClientProfileAdminSerializer
    pagination_class = ManagerDataPagination

    def get_queryset(self):
        queryset = ClientProfile.objects.select_related('user', 'role').order_by('-created_at')
        search = str(self.request.query_params.get('search') or '').strip()
        country = str(self.request.query_params.get('country') or '').strip()
        city = str(self.request.query_params.get('city') or '').strip()
        citizenship = str(self.request.query_params.get('citizenship') or '').strip()

        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(whatsapp__icontains=search)
                | Q(telegram__icontains=search)
            )

        if country:
            queryset = queryset.filter(country__icontains=country)
        if city:
            queryset = queryset.filter(city__icontains=city)
        if citizenship:
            queryset = queryset.filter(citizenship__icontains=citizenship)

        return queryset

    def list(self, request, *args, **kwargs):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)


class ManagerClientProfileDetailView(generics.RetrieveAPIView):
    serializer_class = ClientProfileAdminSerializer
    lookup_url_kwarg = 'profile_id'

    def get_queryset(self):
        return ClientProfile.objects.select_related('user', 'role')

    def retrieve(self, request, *args, **kwargs):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)
