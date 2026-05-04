from django.contrib import admin

from .models import ClientProfile


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'whatsapp', 'country', 'city', 'citizenship', 'language', 'created_at')
    list_filter = ('country', 'citizenship', 'language', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'phone', 'whatsapp')