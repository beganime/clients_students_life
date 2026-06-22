from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from unfold.admin import ModelAdmin

from .models import AppRole, AppUserActivity, ClientProfile

User = get_user_model()


try:
    admin.site.unregister(User)
except NotRegistered:
    pass


@admin.register(User)
class UserAdmin(DjangoUserAdmin, ModelAdmin):
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')


@admin.register(ClientProfile)
class ClientProfileAdmin(ModelAdmin):
    list_display = ('user', 'role', 'phone', 'whatsapp', 'country', 'city', 'citizenship', 'language', 'created_at')
    list_filter = ('role', 'country', 'citizenship', 'language', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'phone', 'whatsapp')
    autocomplete_fields = ('user', 'role')


@admin.register(AppRole)
class AppRoleAdmin(ModelAdmin):
    list_display = ('code', 'name', 'is_manager', 'updated_at')
    list_filter = ('is_manager',)
    search_fields = ('code', 'name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AppUserActivity)
class AppUserActivityAdmin(ModelAdmin):
    list_display = ('user', 'is_online', 'last_seen', 'last_active_at', 'device_platform', 'updated_at')
    list_filter = ('is_online', 'device_platform', 'last_seen')
    search_fields = ('user__username', 'user__email', 'device_id', 'app_version')
    readonly_fields = ('created_at', 'updated_at')
