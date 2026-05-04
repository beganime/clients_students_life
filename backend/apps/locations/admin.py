from django.contrib import admin

from .models import Country, City, Office


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('name', 'short_description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('sort_order', 'name')


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'is_active', 'sort_order')
    list_filter = ('country', 'is_active')
    search_fields = ('name', 'country__name')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('country__name', 'sort_order', 'name')


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('title', 'country', 'city', 'phone', 'whatsapp', 'is_active', 'sort_order')
    list_filter = ('country', 'city', 'is_active')
    search_fields = ('title', 'address', 'phone', 'whatsapp', 'telegram')
    ordering = ('sort_order', 'title')