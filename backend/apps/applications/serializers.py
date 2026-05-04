from rest_framework import serializers

from .models import Application, ApplicationFile, ApplicationStatusHistory


class ApplicationFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationFile
        fields = (
            'id',
            'application',
            'file',
            'file_type',
            'original_name',
            'created_at',
        )
        read_only_fields = ('id', 'application', 'original_name', 'created_at')
        
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
            'target_city',
            'target_university',
            'target_program',
            'education_level',
            'specialty',
            'study_language',
            'start_year',
            'comment',
            'created_at',
        )
        read_only_fields = ('id', 'application_number', 'created_at')

    def validate(self, attrs):
        phone = attrs.get('phone')
        whatsapp = attrs.get('whatsapp')
        telegram = attrs.get('telegram')
        email = attrs.get('email')

        if not any([phone, whatsapp, telegram, email]):
            raise serializers.ValidationError('Укажите хотя бы один способ связи: телефон, WhatsApp, Telegram или email.')
        return attrs


class ApplicationListSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source='service.title', read_only=True)
    target_country_name = serializers.CharField(source='target_country.name', read_only=True)
    target_university_name = serializers.CharField(source='target_university.name', read_only=True)
    assigned_manager_name = serializers.CharField(source='assigned_manager.full_name', read_only=True)

    class Meta:
        model = Application
        fields = (
            'id',
            'application_number',
            'service',
            'service_title',
            'status',
            'assigned_manager_name',
            'full_name',
            'target_country_name',
            'target_university_name',
            'created_at',
            'updated_at',
        )


class ApplicationDetailSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source='service.title', read_only=True)
    target_country_name = serializers.CharField(source='target_country.name', read_only=True)
    target_city_name = serializers.CharField(source='target_city.name', read_only=True)
    target_university_name = serializers.CharField(source='target_university.name', read_only=True)
    target_program_title = serializers.CharField(source='target_program.title', read_only=True)
    assigned_manager_name = serializers.CharField(source='assigned_manager.full_name', read_only=True)
    files = ApplicationFileSerializer(many=True, read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = (
            'id',
            'application_number',
            'service',
            'service_title',
            'status',
            'assigned_manager_name',
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