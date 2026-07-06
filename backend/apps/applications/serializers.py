from rest_framework import serializers

from apps.common.manager_sl import manager_sl_enabled
from apps.locations.models import City, Country
from apps.universities.models import Program, University

from .file_utils import validate_application_file
from .models import Application, ApplicationFile, ApplicationStatusHistory


class ApplicationFileSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ApplicationFile
        fields = (
            'id',
            'application',
            'file',
            'file_type',
            'original_name',
            'status',
            'status_display',
            'admin_comment',
            'reviewed_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'application',
            'original_name',
            'status',
            'status_display',
            'admin_comment',
            'reviewed_at',
            'created_at',
            'updated_at',
        )

    def validate_file(self, value):
        validate_application_file(value)
        return value
         
class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = (
            'id',
            'old_status',
            'new_status',
            'changed_by_name',
            'comment',
            'created_at',
        )


class ApplicationCreateSerializer(serializers.ModelSerializer):
    target_country = serializers.IntegerField(required=False, allow_null=True)
    target_city = serializers.IntegerField(required=False, allow_null=True)
    target_university = serializers.IntegerField(required=False, allow_null=True)
    target_program = serializers.IntegerField(required=False, allow_null=True)
    target_country_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    target_city_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    target_university_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    target_program_title = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Application
        fields = (
            'id',
            'application_number',
            'service',
            'full_name',
            'birth_date',
            'citizenship',
            'country',
            'city',
            'phone',
            'whatsapp',
            'telegram',
            'email',
            'preferred_contact_method',
            'target_country',
            'target_country_name',
            'target_city',
            'target_city_name',
            'target_university',
            'target_university_name',
            'target_program',
            'target_program_title',
            'education_level',
            'specialty',
            'study_language',
            'start_year',
            'comment',
            'manager_sl_application_id',
            'manager_sl_sync_status',
            'manager_sl_sync_error',
            'created_at',
        )
        read_only_fields = (
            'id',
            'application_number',
            'manager_sl_application_id',
            'manager_sl_sync_status',
            'manager_sl_sync_error',
            'created_at',
        )

    def validate(self, attrs):
        phone = attrs.get('phone')
        whatsapp = attrs.get('whatsapp')
        telegram = attrs.get('telegram')
        email = attrs.get('email')

        if not any([phone, whatsapp, telegram, email]):
            raise serializers.ValidationError('Укажите хотя бы один способ связи: телефон, WhatsApp, Telegram или email.')
        return attrs

    def assign_local_or_external(
        self,
        attrs,
        field_name,
        model,
        external_field,
        snapshot_field,
        snapshot_value,
        prefer_external=False,
    ):
        value = attrs.pop(field_name, None)
        if value:
            if prefer_external:
                attrs[external_field] = value
            else:
                obj = model.objects.filter(pk=value).first()
                if obj:
                    attrs[field_name] = obj
                else:
                    attrs[external_field] = value
        if snapshot_value:
            attrs[snapshot_field] = str(snapshot_value).strip()[:255]

    def create(self, validated_data):
        target_country_name = validated_data.pop('target_country_name', '')
        target_city_name = validated_data.pop('target_city_name', '')
        target_university_name = validated_data.pop('target_university_name', '')
        target_program_title = validated_data.pop('target_program_title', '')
        prefer_external = manager_sl_enabled()

        self.assign_local_or_external(
            validated_data,
            'target_country',
            Country,
            'target_country_external_id',
            'target_country_snapshot',
            target_country_name,
            prefer_external=prefer_external,
        )
        self.assign_local_or_external(
            validated_data,
            'target_city',
            City,
            'target_city_external_id',
            'target_city_snapshot',
            target_city_name,
            prefer_external=prefer_external,
        )
        self.assign_local_or_external(
            validated_data,
            'target_university',
            University,
            'target_university_external_id',
            'target_university_snapshot',
            target_university_name,
            prefer_external=prefer_external,
        )
        self.assign_local_or_external(
            validated_data,
            'target_program',
            Program,
            'target_program_external_id',
            'target_program_snapshot',
            target_program_title,
            prefer_external=prefer_external,
        )
        return super().create(validated_data)

    def to_representation(self, instance):
        return ApplicationDetailSerializer(instance, context=self.context).data


class ApplicationListSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source='service.title', read_only=True)
    target_country = serializers.SerializerMethodField()
    target_city = serializers.SerializerMethodField()
    target_university = serializers.SerializerMethodField()
    target_program = serializers.SerializerMethodField()
    target_country_name = serializers.SerializerMethodField()
    target_city_name = serializers.SerializerMethodField()
    target_university_name = serializers.SerializerMethodField()
    target_program_title = serializers.SerializerMethodField()
    assigned_manager_name = serializers.CharField(source='assigned_manager.full_name', read_only=True)

    def get_target_country(self, obj):
        return obj.target_country_id or obj.target_country_external_id

    def get_target_city(self, obj):
        return obj.target_city_id or obj.target_city_external_id

    def get_target_university(self, obj):
        return obj.target_university_id or obj.target_university_external_id

    def get_target_program(self, obj):
        return obj.target_program_id or obj.target_program_external_id

    def get_target_country_name(self, obj):
        return getattr(obj.target_country, 'name', '') or obj.target_country_snapshot

    def get_target_city_name(self, obj):
        return getattr(obj.target_city, 'name', '') or obj.target_city_snapshot

    def get_target_university_name(self, obj):
        return getattr(obj.target_university, 'name', '') or obj.target_university_snapshot

    def get_target_program_title(self, obj):
        return getattr(obj.target_program, 'title', '') or obj.target_program_snapshot

    class Meta:
        model = Application
        fields = (
            'id',
            'application_number',
            'service',
            'service_title',
            'status',
            'manager_sl_application_id',
            'manager_sl_sync_status',
            'assigned_manager_name',
            'full_name',
            'phone',
            'whatsapp',
            'telegram',
            'email',
            'country',
            'city',
            'target_country',
            'target_country_name',
            'target_city',
            'target_city_name',
            'target_university',
            'target_university_name',
            'target_program',
            'target_program_title',
            'comment',
            'created_at',
            'updated_at',
        )


class ApplicationDetailSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source='service.title', read_only=True)
    target_country = serializers.SerializerMethodField()
    target_city = serializers.SerializerMethodField()
    target_university = serializers.SerializerMethodField()
    target_program = serializers.SerializerMethodField()
    target_country_name = serializers.SerializerMethodField()
    target_city_name = serializers.SerializerMethodField()
    target_university_name = serializers.SerializerMethodField()
    target_program_title = serializers.SerializerMethodField()
    assigned_manager_name = serializers.CharField(source='assigned_manager.full_name', read_only=True)
    files = ApplicationFileSerializer(many=True, read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)

    def get_target_country(self, obj):
        return obj.target_country_id or obj.target_country_external_id

    def get_target_city(self, obj):
        return obj.target_city_id or obj.target_city_external_id

    def get_target_university(self, obj):
        return obj.target_university_id or obj.target_university_external_id

    def get_target_program(self, obj):
        return obj.target_program_id or obj.target_program_external_id

    def get_target_country_name(self, obj):
        return getattr(obj.target_country, 'name', '') or obj.target_country_snapshot

    def get_target_city_name(self, obj):
        return getattr(obj.target_city, 'name', '') or obj.target_city_snapshot

    def get_target_university_name(self, obj):
        return getattr(obj.target_university, 'name', '') or obj.target_university_snapshot

    def get_target_program_title(self, obj):
        return getattr(obj.target_program, 'title', '') or obj.target_program_snapshot

    class Meta:
        model = Application
        fields = (
            'id',
            'application_number',
            'service',
            'service_title',
            'status',
            'assigned_manager_name',
            'manager_sl_application_id',
            'manager_sl_sync_status',
            'manager_sl_sync_error',
            'full_name',
            'birth_date',
            'citizenship',
            'country',
            'city',
            'phone',
            'whatsapp',
            'telegram',
            'email',
            'preferred_contact_method',
            'target_country',
            'target_country_name',
            'target_city',
            'target_city_name',
            'target_university',
            'target_university_name',
            'target_program',
            'target_program_title',
            'education_level',
            'specialty',
            'study_language',
            'start_year',
            'comment',
            'files',
            'created_at',
            'updated_at',
            'status_history',
        )
