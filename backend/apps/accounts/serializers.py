from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AppRole, AppUserActivity, ClientProfile, ensure_client_profile, get_app_role_code, is_manager_user

User = get_user_model()


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        ensure_client_profile(self.user)
        return data


class AppUserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUserActivity
        fields = (
            'is_online',
            'last_seen',
            'last_active_at',
            'device_platform',
            'app_version',
            'updated_at',
        )


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = (
            'phone',
            'whatsapp',
            'telegram',
            'country',
            'city',
            'citizenship',
            'avatar',
            'language',
        )


class UserMeSerializer(serializers.ModelSerializer):
    profile = ClientProfileSerializer(source='client_profile', required=False)
    role = serializers.SerializerMethodField()
    is_manager = serializers.SerializerMethodField()
    activity = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_manager',
            'profile',
            'activity',
        )
        read_only_fields = ('id', 'username', 'role', 'is_manager', 'activity')

    def to_representation(self, instance):
        ensure_client_profile(instance)
        return super().to_representation(instance)

    def get_role(self, obj):
        return get_app_role_code(obj)

    def get_is_manager(self, obj):
        return is_manager_user(obj)

    def get_activity(self, obj):
        try:
            activity = obj.app_activity
        except AppUserActivity.DoesNotExist:
            return None
        return AppUserActivitySerializer(activity).data

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('client_profile', {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile, _ = ClientProfile.objects.get_or_create(
            user=instance,
            defaults={'role': AppRole.default_role()},
        )
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        if not profile.role_id:
            profile.role = AppRole.default_role()
        profile.save()

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    whatsapp = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    citizenship = serializers.CharField(required=False, allow_blank=True)
    language = serializers.CharField(required=False, allow_blank=True, default='ru')

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'password',
            'password_confirm',
            'phone',
            'whatsapp',
            'country',
            'city',
            'citizenship',
            'language',
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Пароли не совпадают.'})
        return attrs

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError('Email is required.')
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value

    def create(self, validated_data):
        profile_fields = {
            'phone': validated_data.pop('phone', ''),
            'whatsapp': validated_data.pop('whatsapp', ''),
            'country': validated_data.pop('country', ''),
            'city': validated_data.pop('city', ''),
            'citizenship': validated_data.pop('citizenship', ''),
            'language': validated_data.pop('language', 'ru') or 'ru',
        }
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        email = validated_data.get('email').lower().strip()

        user = User(
            username=email,
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(password)
        user.save()

        profile = ensure_client_profile(user)
        for attr, value in profile_fields.items():
            setattr(profile, attr, value)
        profile.save()
        return user
