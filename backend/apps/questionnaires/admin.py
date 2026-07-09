from django.contrib import admin
from django.contrib import messages
from unfold.admin import ModelAdmin, TabularInline

from .models import ApplicantQuestionnaire, QuestionnaireAttachment


class QuestionnaireAttachmentInline(TabularInline):
    model = QuestionnaireAttachment
    extra = 0
    fields = ('file', 'original_name', 'file_type', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(ApplicantQuestionnaire)
class ApplicantQuestionnaireAdmin(ModelAdmin):
    actions = ('regenerate_documents',)
    list_display = ('user', 'full_name', 'phone', 'citizenship', 'status', 'submitted_at', 'generated_document_at', 'manager_sl_sync_status')
    list_filter = ('status', 'gender', 'data_processing_consent', 'manager_sl_sync_status', 'submitted_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'full_name', 'phone', 'email', 'desired_program')
    readonly_fields = (
        'created_at',
        'updated_at',
        'submitted_at',
        'generated_document',
        'generated_document_at',
        'manager_sl_questionnaire_id',
        'manager_sl_document_url',
        'manager_sl_sync_status',
        'manager_sl_sync_error',
    )
    inlines = [QuestionnaireAttachmentInline]

    @admin.action(description='Перегенерировать документы анкет')
    def regenerate_documents(self, request, queryset):
        generated = 0
        skipped = 0
        for questionnaire in queryset.select_related('user'):
            missing_fields = questionnaire.missing_required_fields()
            if missing_fields:
                skipped += 1
                continue
            questionnaire.generate_document()
            questionnaire.save(update_fields=['generated_document', 'generated_document_at', 'manager_sl_sync_status', 'updated_at'])
            generated += 1
        if generated:
            messages.success(request, f'Документы перегенерированы: {generated}.')
        if skipped:
            messages.warning(request, f'Пропущены анкеты с незаполненными обязательными полями: {skipped}.')


@admin.register(QuestionnaireAttachment)
class QuestionnaireAttachmentAdmin(ModelAdmin):
    list_display = ('questionnaire', 'original_name', 'file_type', 'created_at')
    search_fields = ('questionnaire__full_name', 'questionnaire__user__email', 'original_name')
    readonly_fields = ('created_at', 'updated_at')
