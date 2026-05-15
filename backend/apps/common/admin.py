from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import AppSetting, HomeBanner, OfficeContact


@admin.register(AppSetting)
class AppSettingAdmin(ModelAdmin):
    list_display = ('key', 'description', 'updated_at')
    search_fields = ('key', 'description', 'value')
    list_per_page = 30


@admin.register(HomeBanner)
class HomeBannerAdmin(ModelAdmin):
    list_display = (
        'title',
        'slot',
        'cta_type',
        'is_active',
        'sort_order',
        'updated_at',
    )
    list_filter = ('slot', 'cta_type', 'is_active', 'is_dark')
    search_fields = ('title', 'subtitle', 'description', 'badge')
    autocomplete_fields = ('linked_news', 'linked_service', 'linked_university')
    list_editable = ('is_active', 'sort_order')
    list_per_page = 30

    fieldsets = (
        ('Основное', {
            'fields': (
                'slot',
                'is_active',
                'sort_order',
                'title',
                'subtitle',
                'description',
                'badge',
                'image',
                'background_gradient',
                'is_dark',
            )
        }),
        ('Кнопка / действие', {
            'fields': (
                'cta_text',
                'cta_type',
                'cta_url',
                'linked_news',
                'linked_service',
                'linked_university',
            )
        }),
    )


@admin.register(OfficeContact)
class OfficeContactAdmin(ModelAdmin):
    list_display = (
        'city',
        'country',
        'office_name',
        'phone',
        'email',
        'is_active',
        'sort_order',
    )
    list_filter = ('country', 'is_active')
    search_fields = (
        'city',
        'country',
        'office_name',
        'address',
        'phone',
        'whatsapp',
        'telegram',
        'email',
    )
    list_editable = ('is_active', 'sort_order')
    list_per_page = 30