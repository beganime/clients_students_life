from django.contrib import admin

from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'sort_order', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'short_description', 'description_markdown')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('sort_order', 'title')