from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser

from .models import AppRole, AppUserActivity, ensure_client_profile
from .manager_sl_sync import sync_mobile_client_to_manager_sl
from .serializers import LoginSerializer, RegisterSerializer, UserMeSerializer


def clean_device_value(value, max_length=255):
    return str(value or '').strip()[:max_length]


def normalize_me_payload(data):
    user_fields = ('email', 'first_name', 'last_name')
    profile_fields = ('phone', 'whatsapp', 'telegram', 'country', 'city', 'citizenship', 'avatar', 'language')
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        sync_mobile_client_to_manager_sl(user)
        response_serializer = UserMeSerializer(user, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


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
        user = serializer.save()
        sync_mobile_client_to_manager_sl(user)
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
