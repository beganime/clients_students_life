from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin

from .manager_sl_sync import sync_user_document_to_manager_sl
from .models import RequiredDocumentType, UserDocument


@admin.register(RequiredDocumentType)
class RequiredDocumentTypeAdmin(ModelAdmin):
    list_display = ('title', 'is_required', 'service', 'country', 'category', 'is_active', 'sort_order')
    list_filter = ('is_required', 'is_active', 'service', 'country', 'category')
    search_fields = ('title', 'description', 'category')
    autocomplete_fields = ('service', 'country')
    list_editable = ('is_required', 'is_active', 'sort_order')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UserDocument)
class UserDocumentAdmin(ModelAdmin):
    list_display = ('user', 'document_type', 'status', 'manager_sl_sync_status', 'uploaded_at', 'reviewed_at', 'reviewed_by')
    list_filter = ('status', 'manager_sl_sync_status', 'document_type', 'uploaded_at', 'reviewed_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'document_type__title', 'original_name', 'admin_comment')
    autocomplete_fields = ('user', 'document_type', 'reviewed_by')
    readonly_fields = ('created_at', 'updated_at', 'uploaded_at', 'manager_sl_sync_status', 'manager_sl_sync_error')
    actions = ('approve_documents', 'reject_documents')
    list_per_page = 100

    def save_model(self, request, obj, form, change):
        if obj.status in {UserDocument.Status.APPROVED, UserDocument.Status.REJECTED}:
            obj.reviewed_by = obj.reviewed_by or request.user
            obj.reviewed_at = obj.reviewed_at or timezone.now()
        super().save_model(request, obj, form, change)
        if obj.status != UserDocument.Status.NOT_UPLOADED and obj.file:
            sync_user_document_to_manager_sl(obj, request=request)

    @admin.action(description='Принять выбранные документы')
    def approve_documents(self, request, queryset):
        for document in queryset:
            document.status = UserDocument.Status.APPROVED
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])
            sync_user_document_to_manager_sl(document, request=request)

    @admin.action(description='Отклонить выбранные документы')
    def reject_documents(self, request, queryset):
        for document in queryset:
            document.status = UserDocument.Status.REJECTED
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])
            sync_user_document_to_manager_sl(document, request=request)
