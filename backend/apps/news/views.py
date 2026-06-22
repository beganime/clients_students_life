from rest_framework import viewsets

from apps.common.viewsets import IdOrSlugLookupMixin

from .models import NewsCategory, NewsPost
from .serializers import NewsCategorySerializer, NewsDetailSerializer, NewsListSerializer


class NewsCategoryViewSet(IdOrSlugLookupMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    serializer_class = NewsCategorySerializer
    queryset = NewsCategory.objects.all().order_by('title')
    search_fields = ('title',)


class NewsPostViewSet(IdOrSlugLookupMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    filterset_fields = ('category', 'category__slug', 'is_important')
    search_fields = ('title', 'short_description', 'content_markdown')
    ordering_fields = ('published_at', 'created_at', 'title')
    ordering = ('-published_at', '-created_at')

    def get_queryset(self):
        return (
            NewsPost.objects
            .filter(status=NewsPost.Status.PUBLISHED)
            .select_related('category', 'author_staff')
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NewsDetailSerializer
        return NewsListSerializer
