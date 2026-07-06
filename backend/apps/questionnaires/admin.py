from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import ApplicantQuestionnaire, QuestionnaireAttachment


class QuestionnaireAttachmentInline(TabularInline):
    model = QuestionnaireAttachment
    extra = 0
    fields = ('file', 'original_name', 'file_type', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(ApplicantQuestionnaire)
class ApplicantQuestionnaireAdmin(ModelAdmin):
    list_display = ('user', 'full_name', 'phone', 'citizenship', 'status', 'submitted_at', 'manager_sl_sync_status')
    list_filter = ('status', 'gender', 'data_processing_consent', 'manager_sl_sync_status', 'submitted_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'full_name', 'phone', 'email', 'desired_program')
    readonly_fields = ('created_at', 'updated_at', 'submitted_at', 'manager_sl_questionnaire_id', 'manager_sl_document_url', 'manager_sl_sync_status', 'manager_sl_sync_error')
    inlines = [QuestionnaireAttachmentInline]


@admin.register(QuestionnaireAttachment)
class QuestionnaireAttachmentAdmin(ModelAdmin):
    list_display = ('questionnaire', 'original_name', 'file_type', 'created_at')
    search_fields = ('questionnaire__full_name', 'questionnaire__user__email', 'original_name')
    readonly_fields = ('created_at', 'updated_at')
