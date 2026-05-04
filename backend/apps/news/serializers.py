from rest_framework import serializers

from apps.staff.serializers import StaffProfileSerializer
from .models import NewsCategory, NewsPost


class NewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ('id', 'title', 'slug')


class NewsListSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source='category.title', read_only=True)
    author_name = serializers.CharField(source='author_staff.full_name', read_only=True)
    author_avatar = serializers.ImageField(source='author_staff.avatar', read_only=True)

    class Meta:
        model = NewsPost
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
            'is_important',
            'published_at',
        )


class NewsDetailSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source='category.title', read_only=True)
    author_staff = StaffProfileSerializer(read_only=True)

    class Meta:
        model = NewsPost
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
            'is_important',
            'published_at',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        )