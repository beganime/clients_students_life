import json

from rest_framework import serializers

from apps.applications.file_utils import clean_original_name, validate_application_file

from .labels import questionnaire_field_labels
from .models import ApplicantQuestionnaire, QuestionnaireAttachment


FIELD_ALIASES = {
    'application_type': 'form_type',
    'country': 'residence_country',
    'region': 'residence_region',
    'city': 'residence_city',
    'street': 'residence_street',
    'house': 'residence_house',
    'apartment': 'residence_house',
    'postal_code': 'residence_postal_code',
    'passport_valid_from': 'passport_issue_date',
    'passport_valid_to': 'passport_expiry_date',
    'additional_phone': 'extra_phone',
    'whatsapp': 'imo',
    'parent_phone': 'parent_contacts',
    'parent_job': 'parent_workplace',
    'study_goal': 'admission_goal',
    'desired_university': 'desired_city',
    'desired_study_language': 'desired_language',
    'source': 'referral_source',
    'needs_help_with': 'help_needed',
    'personal_data_agreement': 'data_processing_consent',
}


def normalize_json_field_value(value):
    if isinstance(value, (list, tuple)) and len(value) == 1 and isinstance(value[0], str):
        value = value[0]
    if isinstance(value, str):
        try:
            parsed = json.loads(value) if value.strip() else []
        except json.JSONDecodeError:
            return [item.strip() for item in value.split(',') if item.strip()]
        if parsed in (None, ''):
            return []
        if isinstance(parsed, list):
            return parsed
        return [parsed]
    if value in (None, ''):
        return []
    return value


def normalize_multipart_data(data):
    if not hasattr(data, 'lists'):
        return data.copy() if hasattr(data, 'copy') else dict(data)

    normalized = {}
    for key, values in data.lists():
        if not values:
            continue
        normalized[key] = values if len(values) > 1 else values[0]
    return normalized


def absolute_file_url(request, file_field):
    if not file_field:
        return None
    try:
        url = file_field.url
    except ValueError:
        return None
    return request.build_absolute_uri(url) if request else url


class QuestionnaireAttachmentSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = QuestionnaireAttachment
        fields = ('id', 'file', 'original_name', 'file_type', 'created_at')

    def get_file(self, obj):
        return absolute_file_url(self.context.get('request'), obj.file)


class ApplicantQuestionnaireSerializer(serializers.ModelSerializer):
    face_photo = serializers.SerializerMethodField()
    attachments = QuestionnaireAttachmentSerializer(many=True, read_only=True)
    generated_document_url = serializers.SerializerMethodField()
    document_file = serializers.SerializerMethodField()
    missing_required_fields = serializers.SerializerMethodField()
    missing_required_field_labels = serializers.SerializerMethodField()

    class Meta:
        model = ApplicantQuestionnaire
        fields = (
            'id',
            'status',
            'form_type',
            'full_name',
            'birth_date',
            'gender',
            'citizenship',
            'marital_status',
            'face_photo',
            'residence_country',
            'residence_region',
            'residence_city',
            'residence_street',
            'residence_house',
            'residence_postal_code',
            'passport_number',
            'passport_issued_by',
            'passport_issue_date',
            'passport_expiry_date',
            'phone',
            'email',
            'extra_phone',
            'imo',
            'telegram',
            'preferred_contact_method',
            'parent_full_name',
            'parent_relation',
            'parent_contacts',
            'parent_workplace',
            'family_members',
            'education_level',
            'school_class',
            'school_name',
            'school_country',
            'school_city',
            'graduation_year',
            'education_status',
            'achievements',
            'languages',
            'desired_program',
            'admission_goal',
            'desired_city',
            'desired_country',
            'desired_language',
            'desired_education_level',
            'admission_urgency',
            'help_needed',
            'has_visa',
            'visa_country',
            'visa_city',
            'visa_valid_until',
            'has_international_passport',
            'hobbies',
            'applicant_comment',
            'referral_source',
            'data_processing_consent',
            'submitted_at',
            'attachments',
            'generated_document_url',
            'document_file',
            'generated_document_at',
            'missing_required_fields',
            'missing_required_field_labels',
            'updated_at',
        )
        read_only_fields = ('id', 'status', 'submitted_at', 'attachments', 'generated_document_url', 'document_file', 'generated_document_at', 'missing_required_fields', 'missing_required_field_labels', 'updated_at')

    def get_face_photo(self, obj):
        return absolute_file_url(self.context.get('request'), obj.face_photo)

    def get_generated_document_url(self, obj):
        request = self.context.get('request')
        return absolute_file_url(request, obj.generated_document) or obj.manager_sl_document_url or ''

    def get_document_file(self, obj):
        return self.get_generated_document_url(obj)

    def get_missing_required_fields(self, obj):
        return obj.missing_required_fields()

    def get_missing_required_field_labels(self, obj):
        return questionnaire_field_labels(obj.missing_required_fields())


class ApplicantQuestionnaireUpdateSerializer(serializers.ModelSerializer):
    save_mode = serializers.ChoiceField(choices=('draft', 'submitted', 'completed'), write_only=True, required=False, default='draft')

    class Meta:
        model = ApplicantQuestionnaire
        exclude = (
            'user',
            'created_at',
            'updated_at',
            'submitted_at',
            'status',
            'manager_sl_questionnaire_id',
            'manager_sl_document_url',
            'manager_sl_sync_status',
            'manager_sl_sync_error',
        )

    def to_internal_value(self, data):
        mutable = normalize_multipart_data(data)
        for alias, field in FIELD_ALIASES.items():
            if alias in mutable and field not in mutable:
                mutable[field] = mutable.get(alias)
        for field in ('achievements', 'languages', 'help_needed'):
            if field in mutable:
                mutable[field] = normalize_json_field_value(mutable.get(field))
        return super().to_internal_value(mutable)

    def validate(self, attrs):
        return attrs

    def update(self, instance, validated_data):
        validated_data.pop('save_mode', None)
        return super().update(instance, validated_data)


class QuestionnaireAttachmentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionnaireAttachment
        fields = ('file',)

    def validate_file(self, value):
        validate_application_file(value)
        return value

    def create(self, validated_data):
        uploaded_file = validated_data['file']
        return QuestionnaireAttachment.objects.create(
            questionnaire=self.context['questionnaire'],
            file=uploaded_file,
            original_name=clean_original_name(uploaded_file),
            file_type=getattr(uploaded_file, 'content_type', '') or '',
        )
