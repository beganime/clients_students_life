from rest_framework import serializers

from .models import FavoriteUniversity, Program, University


class ProgramSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.name', read_only=True)
    country_name = serializers.CharField(source='university.country.name', read_only=True)
    city_name = serializers.CharField(source='university.city.name', read_only=True)

    class Meta:
        model = Program
        fields = (
            'id',
            'university',
            'university_name',
            'country_name',
            'city_name',
            'title',
            'level',
            'faculty',
            'specialty',
            'language',
            'duration',
            'tuition_fee',
            'currency',
            'application_deadline',
            'start_date',
            'required_documents',
            'requirements',
            'sort_order',
        )


class UniversityListSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    country_slug = serializers.CharField(source='country.slug', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_slug = serializers.CharField(source='city.slug', read_only=True)
    is_favorite = serializers.SerializerMethodField()
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return FavoriteUniversity.objects.filter(user=request.user, university=obj).exists()
    
    class Meta:
        model = University
        fields = (
            'id',
            'name',
            'slug',
            'country',
            'country_name',
            'country_slug',
            'city',
            'city_name',
            'city_slug',
            'logo',
            'cover_image',
            'university_type',
            'partner_status',
            'recognized_status',
            'languages',
            'education_levels',
            'has_dormitory',
            'dormitory_cost',
            'scholarship_available',
            'tuition_from',
            'application_deadline',
            'sort_order',
            'is_favorite',
        )


class UniversityDetailSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    country_slug = serializers.CharField(source='country.slug', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_slug = serializers.CharField(source='city.slug', read_only=True)
    programs = ProgramSerializer(many=True, read_only=True)

    class Meta:
        model = University
        fields = (
            'id',
            'name',
            'slug',
            'country',
            'country_name',
            'country_slug',
            'city',
            'city_name',
            'city_slug',
            'logo',
            'cover_image',
            'description_markdown',
            'university_type',
            'partner_status',
            'recognized_status',
            'official_website',
            'languages',
            'education_levels',
            'has_dormitory',
            'dormitory_cost',
            'scholarship_available',
            'tuition_from',
            'application_deadline',
            'required_documents',
            'programs',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        )
        
class FavoriteUniversitySerializer(serializers.ModelSerializer):
    university_detail = UniversityListSerializer(source='university', read_only=True)

    class Meta:
        model = FavoriteUniversity
        fields = ('id', 'university', 'university_detail', 'created_at')
        read_only_fields = ('id', 'created_at')