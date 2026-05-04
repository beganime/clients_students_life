from rest_framework import serializers

from .models import Service


class ServiceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = (
            'id',
            'title',
            'slug',
            'short_description',
            'icon',
            'cover_image',
            'estimated_time',
            'button_text',
            'sort_order',
        )


class ServiceDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = (
            'id',
            'title',
            'slug',
            'short_description',
            'description_markdown',
            'icon',
            'cover_image',
            'required_documents',
            'estimated_time',
            'button_text',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        )