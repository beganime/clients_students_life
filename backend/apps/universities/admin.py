from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import FavoriteUniversity, Program, University


class ProgramInline(admin.TabularInline):
    model = Program
    extra = 0
    show_change_link = True
    fields = (
        'title',
        'level',
        'faculty',
        'specialty',
        'language',
        'duration',
        'tuition_fee',
        'currency',
        'is_active',
        'sort_order',
    )


@admin.register(University)
class UniversityAdmin(ModelAdmin):
    list_display = (
        'name',
        'country',
        'city',
        'university_type',
        'partner_status',
        'recognized_status',
        'has_dormitory',
        'is_active',
        'sort_order',
    )
    list_filter = (
        'country',
        'city',
        'university_type',
        'partner_status',
        'recognized_status',
        'has_dormitory',
        'scholarship_available',
        'is_active',
    )
    search_fields = ('name', 'description_markdown', 'official_website')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProgramInline]
    ordering = ('sort_order', 'name')
    list_editable = ('is_active', 'sort_order')
    list_per_page = 100
    list_select_related = ('country', 'city')


@admin.register(Program)
class ProgramAdmin(ModelAdmin):
    list_display = ('title', 'university', 'level', 'language', 'tuition_fee', 'currency', 'is_active', 'sort_order')
    list_filter = ('level', 'language', 'currency', 'is_active', 'university__country', 'university__city')
    search_fields = ('title', 'faculty', 'specialty', 'requirements', 'required_documents', 'university__name', 'university__country__name', 'university__city__name')
    ordering = ('university__name', 'sort_order', 'title')
    autocomplete_fields = ('university',)
    list_editable = ('is_active', 'sort_order')
    list_per_page = 200
    list_max_show_all = 2000
    show_full_result_count = True
    list_select_related = ('university', 'university__country', 'university__city')
    
@admin.register(FavoriteUniversity)
class FavoriteUniversityAdmin(ModelAdmin):
    list_display = ('user', 'university', 'created_at')
    list_filter = ('created_at', 'university__country')
    search_fields = ('user__username', 'user__email', 'university__name')
    autocomplete_fields = ('user', 'university')
