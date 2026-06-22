from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import StaffProfile


@admin.register(StaffProfile)
class StaffProfileAdmin(ModelAdmin):
    list_display = ('full_name', 'user_email', 'position', 'phone', 'office', 'is_public', 'show_contacts', 'is_active', 'sort_order')
    list_filter = ('office', 'is_public', 'show_contacts', 'is_active')
    search_fields = ('full_name', 'position', 'languages', 'specialization', 'phone', 'whatsapp', 'user__email', 'user__username')
    autocomplete_fields = ('user', 'office')
    ordering = ('sort_order', 'full_name')
    list_editable = ('is_public', 'is_active', 'sort_order')

    @admin.display(description='Email')
    def user_email(self, obj):
        return obj.user.email if obj.user_id else ''
