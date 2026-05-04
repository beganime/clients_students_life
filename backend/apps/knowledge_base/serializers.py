from rest_framework import serializers

from apps.staff.serializers import StaffProfileSerializer
from .models import KnowledgeArticle, KnowledgeCategory


class KnowledgeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeCategory
        fields = ('id', 'title', 'slug')


class KnowledgeListSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source='category.title', read_only=True)
    author_name = serializers.CharField(source='author_staff.full_name', read_only=True)
    author_avatar = serializers.ImageField(source='author_staff.avatar', read_only=True)

    class Meta:
        model = KnowledgeArticle
        fields = (
            'id',
            'title',
            'slug',
            'short_description',
            'cover_image',
            'category',
            'category_title',
            'author_name',
            'author_avatar',
            'tags',
            'published_at',
        )


class KnowledgeDetailSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source='category.title', read_only=True)
    author_staff = StaffProfileSerializer(read_only=True)

    class Meta:
        model = KnowledgeArticle
        fields = (
            'id',
            'title',
            'slug',
            'short_description',
            'content_markdown',
            'cover_image',
            'category',
            'category_title',
            'author_staff',
            'tags',
            'published_at',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        )