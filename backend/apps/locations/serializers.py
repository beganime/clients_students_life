from rest_framework import serializers

from .models import City, Country, Office


class CountryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = (
            'id',
            'name',
            'slug',
            'flag',
            'cover_image',
            'short_description',
            'average_tuition',
            'average_living_cost',
            'sort_order',
        )


class CountryDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = (
            'id',
            'name',
            'slug',
            'flag',
            'cover_image',
            'short_description',
            'description_markdown',
            'visa_info',
            'work_info',
            'average_tuition',
            'average_living_cost',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        )


class CitySerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    country_slug = serializers.CharField(source='country.slug', read_only=True)

    class Meta:
        model = City
        fields = (
            'id',
            'country',
            'country_name',
            'country_slug',
            'name',
            'slug',
            'image',
            'description_markdown',
            'rent_cost',
            'food_cost',
            'transport_cost',
            'total_monthly_cost',
            'sort_order',
        )


class OfficeSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = Office
        fields = (
            'id',
            'country',
            'country_name',
            'city',
            'city_name',
            'title',
            'address',
            'phone',
            'whatsapp',
            'telegram',
            'imo',
            'work_time',
            'latitude',
            'longitude',
            'image',
            'sort_order',
        )