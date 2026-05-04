from django.contrib import admin

from .models import StaffProfile


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'position', 'office', 'is_public', 'show_contacts', 'is_active', 'sort_order')
    list_filter = ('office', 'is_public', 'show_contacts', 'is_active')
    search_fields = ('full_name', 'position', 'languages', 'specialization', 'phone', 'whatsapp')
    ordering = ('sort_order', 'full_name')