from rest_framework import serializers

from .models import FavoriteUniversity, Program, University


class ProgramSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.name', read_only=True)
    country_name = serializers.CharField(source='university.country.name', read_only=True)
    city_name = serializers.CharField(source='university.city.name', read_only=True)
    university_logo = serializers.ImageField(source='university.logo', read_only=True)
    university_cover = serializers.ImageField(source='university.cover_image', read_only=True)
    description_markdown = serializers.SerializerMethodField()
    intakes = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    def get_description_markdown(self, obj):
        return obj.requirements or obj.required_documents or ''

    def get_intakes(self, obj):
        return obj.start_date or obj.application_deadline or ''

    def get_documents(self, obj):
        return obj.required_documents or ''

    class Meta:
        model = Program
        fields = (
            'id',
            'university',
            'university_name',
            'university_logo',
            'university_cover',
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
            'intakes',
            'required_documents',
            'documents',
            'requirements',
            'description_markdown',
            'sort_order',
        )


class UniversityListSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    country_slug = serializers.CharField(source='country.slug', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_slug = serializers.CharField(source='city.slug', read_only=True)
    is_favorite = serializers.SerializerMethodField()
    programs_count = serializers.IntegerField(source='programs.count', read_only=True)
    
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
            'programs_count',
            'sort_order',
            'is_favorite',
        )


class UniversityDetailSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    country_slug = serializers.CharField(source='country.slug', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_slug = serializers.CharField(source='city.slug', read_only=True)
    programs = ProgramSerializer(many=True, read_only=True)
    programs_count = serializers.IntegerField(source='programs.count', read_only=True)
    admission_requirements = serializers.SerializerMethodField()
    dormitory_info = serializers.SerializerMethodField()
    expenses_info = serializers.SerializerMethodField()
    public_contacts = serializers.SerializerMethodField()
    contacts = serializers.SerializerMethodField()
    contact_people = serializers.SerializerMethodField()

    def get_admission_requirements(self, obj):
        return obj.required_documents or obj.application_deadline or ''

    def get_dormitory_info(self, obj):
        if not obj.has_dormitory:
            return ''
        return obj.dormitory_cost or 'Dormitory is available.'

    def get_expenses_info(self, obj):
        return obj.tuition_from or obj.dormitory_cost or ''

    def get_public_contacts(self, obj):
        return obj.official_website or ''

    def get_contacts(self, obj):
        return {
            'website': obj.official_website,
        } if obj.official_website else {}

    def get_contact_people(self, obj):
        return []

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
            'admission_requirements',
            'dormitory_info',
            'expenses_info',
            'public_contacts',
            'contacts',
            'contact_people',
            'programs_count',
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
