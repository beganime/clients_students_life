from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.common.models import TimeStampedModel


class AppRole(TimeStampedModel):
    USER = 'user'
    MANAGER = 'manager'

    code = models.SlugField('Code', max_length=50, unique=True)
    name = models.CharField('Name', max_length=120)
    description = models.TextField('Description', blank=True)
    is_manager = models.BooleanField('Manager access', default=False)

    class Meta:
        verbose_name = 'App role'
        verbose_name_plural = 'App roles'
        ordering = ['code']

    def __str__(self):
        return self.name or self.code

    @classmethod
    def default_role(cls):
        role, _ = cls.objects.get_or_create(
            code=cls.USER,
            defaults={
                'name': 'User',
                'description': 'Default mobile application user role.',
                'is_manager': False,
            },
        )
        return role


class ClientProfile(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_profile',
        verbose_name='Пользователь'
    )
    phone = models.CharField('Телефон', max_length=100, blank=True)
    role = models.ForeignKey(
        AppRole,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='profiles',
        verbose_name='App role',
    )
    whatsapp = models.CharField('WhatsApp', max_length=100, blank=True)
    telegram = models.CharField('Telegram', max_length=100, blank=True)
    country = models.CharField('Страна проживания', max_length=255, blank=True)
    city = models.CharField('Город проживания', max_length=255, blank=True)
    citizenship = models.CharField('Гражданство', max_length=255, blank=True)
    avatar = models.ImageField('Аватар', upload_to='users/avatars/', blank=True, null=True)
    language = models.CharField('Язык приложения', max_length=10, default='ru')

    class Meta:
        verbose_name = 'Профиль клиента'
        verbose_name_plural = 'Профили клиентов'

    def __str__(self):
        return f'Профиль {self.user}'


class AppUserActivity(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='app_activity',
        verbose_name='User',
    )
    is_online = models.BooleanField('Online', default=False)
    last_seen = models.DateTimeField('Last seen', null=True, blank=True)
    last_active_at = models.DateTimeField('Last active at', null=True, blank=True)
    device_platform = models.CharField('Device platform', max_length=40, blank=True)
    device_id = models.CharField('Device ID', max_length=255, blank=True)
    app_version = models.CharField('App version', max_length=80, blank=True)

    class Meta:
        verbose_name = 'App user activity'
        verbose_name_plural = 'App user activities'
        ordering = ['-last_active_at', '-last_seen']

    def __str__(self):
        return f'{self.user} online={self.is_online}'


def get_app_role_code(user):
    if not user or not user.is_authenticated:
        return AppRole.USER
    if user.is_superuser or user.is_staff:
        return AppRole.MANAGER
    try:
        profile = user.client_profile
    except ClientProfile.DoesNotExist:
        return AppRole.USER
    return profile.role.code if profile.role_id else AppRole.USER


def is_manager_user(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    try:
        profile = user.client_profile
    except ClientProfile.DoesNotExist:
        return False
    return bool(profile.role_id and profile.role.is_manager)


def ensure_client_profile(user):
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    profile, _ = ClientProfile.objects.get_or_create(
        user=user,
        defaults={'role': AppRole.default_role()},
    )
    if not profile.role_id:
        profile.role = AppRole.default_role()
        profile.save(update_fields=['role', 'updated_at'])
    return profile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_mobile_profile_for_user(sender, instance, created, **kwargs):
    if created:
        ensure_client_profile(instance)
