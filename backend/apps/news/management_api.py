"""ManagerSL service-only editing of the existing public news feed."""
import secrets
import uuid
from django.conf import settings
from rest_framework import permissions, serializers, viewsets
from rest_framework.pagination import PageNumberPagination
from .models import NewsPost


class ContentServicePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        provided = request.headers.get('X-API-KEY', '')
        keys = [getattr(settings, name, '') for name in (
            'MANAGER_SL_LEADS_API_KEY', 'MANAGER_SL_API_KEY',
            'STUDENTS_LIFE_API_KEY', 'LEADS_API_KEY')]
        return bool(provided and any(key and secrets.compare_digest(provided, key) for key in keys))


class ManagedNewsSerializer(serializers.ModelSerializer):
    content_markdown = serializers.CharField(max_length=30000, allow_blank=True, required=False)

    class Meta:
        model = NewsPost
        fields = ('id', 'title', 'slug', 'short_description', 'content_markdown',
                  'cover_image', 'status', 'is_important', 'published_at')
        read_only_fields = ('id', 'slug', 'published_at')

    def create(self, validated_data):
        # Titles may repeat; the public URL must remain unique and stable on edits.
        validated_data['slug'] = 'news-' + uuid.uuid4().hex
        return super().create(validated_data)

    def validate(self, attrs):
        image = attrs.get('cover_image', getattr(self.instance, 'cover_image', None))
        if not image:
            raise serializers.ValidationError({'cover_image': 'Добавьте баннер новости.'})
        return attrs

    def validate_cover_image(self, image):
        if image and image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Изображение должно быть не больше 5 МБ.')
        return image


class NewsPagination(PageNumberPagination):
    page_size = 20


class ManagedNewsViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    permission_classes = (ContentServicePermission,)
    serializer_class = ManagedNewsSerializer
    pagination_class = NewsPagination
    queryset = NewsPost.objects.all().order_by('-created_at', '-pk')
    search_fields = ('title', 'short_description')
    filterset_fields = ('status',)
