from django.contrib import admin

from .models import Application, ApplicationFile, ApplicationStatusHistory


class ApplicationFileInline(admin.TabularInline):
    model = ApplicationFile
    extra = 0
    readonly_fields = ('created_at', 'updated_at')
    
class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('old_status', 'new_status', 'changed_by', 'comment', 'created_at', 'updated_at')
    can_delete = False


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'application_number',
        'full_name',
        'service',
        'status',
        'assigned_manager',
        'phone',
        'whatsapp',
        'target_country',
        'target_university',
        'source',
        'created_at',
    )
    list_filter = (
        'status',
        'service',
        'assigned_manager',
        'target_country',
        'target_university',
        'source',
        'created_at',
    )
    search_fields = (
        'application_number',
        'full_name',
        'phone',
        'whatsapp',
        'telegram',
        'email',
        'comment',
    )
    readonly_fields = ('application_number', 'source', 'ip_address', 'user_agent', 'device_platform', 'created_at', 'updated_at')
    inlines = [ApplicationFileInline, ApplicationStatusHistoryInline]
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)


@admin.register(ApplicationFile)
class ApplicationFileAdmin(admin.ModelAdmin):
    list_display = ('application', 'file_type', 'original_name', 'uploaded_by', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('application__application_number', 'application__full_name', 'original_name')
    
@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('application', 'old_status', 'new_status', 'changed_by', 'created_at')
    list_filter = ('old_status', 'new_status', 'created_at')
    search_fields = ('application__application_number', 'application__full_name', 'comment')
    readonly_fields = ('created_at', 'updated_at')