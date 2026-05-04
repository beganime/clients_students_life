from django.contrib import admin

from .models import FavoriteUniversity, Program, University


class ProgramInline(admin.TabularInline):
    model = Program
    extra = 0
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
class UniversityAdmin(admin.ModelAdmin):
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


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('title', 'university', 'level', 'language', 'tuition_fee', 'currency', 'is_active')
    list_filter = ('level', 'language', 'currency', 'is_active', 'university__country')
    search_fields = ('title', 'faculty', 'specialty', 'university__name')
    ordering = ('university__name', 'sort_order', 'title')
    
@admin.register(FavoriteUniversity)
class FavoriteUniversityAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'created_at')
    list_filter = ('created_at', 'university__country')
    search_fields = ('user__username', 'user__email', 'university__name')