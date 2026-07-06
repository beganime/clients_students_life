import json
from urllib import error as urlerror
from urllib import request as urlrequest

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser

from .models import AppRole, AppUserActivity, ensure_client_profile
from .serializers import LoginSerializer, RegisterSerializer, UserMeSerializer

User = get_user_model()


def clean_device_value(value, max_length=255):
    return str(value or '').strip()[:max_length]


def manager_sl_login(username, password):
    base_url = str(getattr(settings, 'MANAGER_SL_AUTH_BASE_URL', 'https://manager-sl.ru') or '').rstrip('/')
    payload = json.dumps({'username': username, 'password': password}).encode('utf-8')
    request = urlrequest.Request(
        f'{base_url}/api/auth/login/',
        data=payload,
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
        method='POST',
    )
    try:
        with urlrequest.urlopen(request, timeout=getattr(settings, 'MANAGER_SL_TIMEOUT_SECONDS', 8)) as response:
            return json.loads(response.read().decode('utf-8'))
    except urlerror.HTTPError as exc:
        detail = 'Manager login failed.'
        try:
            body = json.loads(exc.read().decode('utf-8'))
            detail = body.get('detail') or body.get('error') or detail
        except Exception:
            pass
        raise ValueError(detail) from exc
    except (urlerror.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise ConnectionError('Manager authorization service is temporarily unavailable.') from exc


def local_manager_user(manager_user, fallback_username):
    manager_id = manager_user.get('id')
    email = str(manager_user.get('email') or '').strip().lower()
    first_name = str(manager_user.get('first_name') or '').strip()
    last_name = str(manager_user.get('last_name') or '').strip()
    username_source = email or fallback_username or f'manager-{manager_id or "external"}'
    username_slug = slugify(username_source.replace('@', '-'), allow_unicode=False) or 'manager'
    username = f'manager_sl_{manager_id}' if manager_id else username_slug[:140]

    user = User.objects.filter(username=username).first()
    if not user and email:
        user = User.objects.filter(email=email).first()

    if not user:
        user = User(username=username[:150], email=email)
        user.set_unusable_password()

    user.email = email or user.email
    user.first_name = first_name[:150]
    user.last_name = last_name[:150]
    user.save()

    manager_role, _ = AppRole.objects.get_or_create(
        code=AppRole.MANAGER,
        defaults={
            'name': 'Manager',
            'description': 'Mobile manager role verified through manager-sl.',
            'is_manager': True,
        },
    )
    if not manager_role.is_manager:
        manager_role.is_manager = True
        manager_role.save(update_fields=['is_manager', 'updated_at'])

    profile = ensure_client_profile(user)
    profile.role = manager_role
    profile.save(update_fields=['role', 'updated_at'])
    return user


class LoginView(TokenObtainPairView):
    throttle_scope = 'login'
    serializer_class = LoginSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response_serializer = UserMeSerializer(user, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ManagerLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        username = str(request.data.get('username') or request.data.get('email') or '').strip()
        password = str(request.data.get('password') or '')
        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            manager_response = manager_sl_login(username, password)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
        except ConnectionError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        manager_user = manager_response.get('user') or {}
        user = local_manager_user(manager_user, username)
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        user_data = UserMeSerializer(user, context={'request': request}).data
        return Response(
            {
                'access': str(access),
                'refresh': str(refresh),
                'user': user_data,
                'manager_sl_user': manager_user,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        ensure_client_profile(request.user)
        serializer = UserMeSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserMeSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
