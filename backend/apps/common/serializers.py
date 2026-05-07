from rest_framework import serializers

from .models import AppSetting, HomeBanner, OfficeContact


class AppSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppSetting
        fields = ('key', 'value', 'description')


class HomeBannerSerializer(serializers.ModelSerializer):
    linked_news_slug = serializers.CharField(source='linked_news.slug', read_only=True)
    linked_service_slug = serializers.CharField(source='linked_service.slug', read_only=True)
    linked_university_slug = serializers.CharField(source='linked_university.slug', read_only=True)

    class Meta:
        model = HomeBanner
        fields = (
            'id',
            'slot',
            'title',
            'subtitle',
            'description',
            'badge',
            'image',
            'cta_text',
            'cta_type',
            'cta_url',
            'linked_news_slug',
            'linked_service_slug',
            'linked_university_slug',
            'background_gradient',
            'is_dark',
            'sort_order',
        )


class OfficeContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficeContact
        fields = (
            'id',
            'country',
            'city',
            'office_name',
            'address',
            'phone',
            'whatsapp',
            'telegram',
            'email',
            'instagram',
            'tiktok',
            'website',
            'map_url',
            'work_hours',
            'note',
            'sort_order',
        )