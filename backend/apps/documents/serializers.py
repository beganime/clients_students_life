from rest_framework import serializers

from apps.applications.file_utils import clean_original_name, validate_application_file

from .models import RequiredDocumentType, UserDocument


class MyDocumentSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='document_type.id')
    document_id = serializers.IntegerField(source='id', allow_null=True)
    title = serializers.CharField(source='document_type.title')
    description = serializers.CharField(source='document_type.description')
    is_required = serializers.BooleanField(source='document_type.is_required')
    status = serializers.CharField()
    file = serializers.FileField(allow_null=True)
    original_name = serializers.CharField()
    admin_comment = serializers.CharField()
    uploaded_at = serializers.DateTimeField(allow_null=True)
    reviewed_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class UserDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = ('file',)

    def validate_file(self, value):
        validate_application_file(value)
        return value

    def update(self, instance, validated_data):
        uploaded_file = validated_data.get('file')
        if uploaded_file:
            instance.file = uploaded_file
            instance.mark_uploaded(clean_original_name(uploaded_file))
        instance.save()
        return instance


class RequiredDocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocumentType
        fields = (
            'id',
            'title',
            'description',
            'is_required',
            'service',
            'country',
            'category',
            'sort_order',
            'is_active',
        )
