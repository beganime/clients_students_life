from rest_framework import viewsets

from apps.common.viewsets import IdOrSlugLookupMixin

from .models import KnowledgeArticle, KnowledgeCategory
from .serializers import KnowledgeCategorySerializer, KnowledgeDetailSerializer, KnowledgeListSerializer


class KnowledgeCategoryViewSet(IdOrSlugLookupMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    serializer_class = KnowledgeCategorySerializer
    queryset = KnowledgeCategory.objects.all().order_by('title')
    search_fields = ('title',)


class KnowledgeArticleViewSet(IdOrSlugLookupMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    filterset_fields = ('category', 'category__slug')
    search_fields = ('title', 'short_description', 'content_markdown', 'tags')
    ordering_fields = ('published_at', 'created_at', 'title')
    ordering = ('-published_at', '-created_at')

    def get_queryset(self):
        return (
            KnowledgeArticle.objects
            .filter(status=KnowledgeArticle.Status.PUBLISHED)
            .select_related('category', 'author_staff')
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return KnowledgeDetailSerializer
        return KnowledgeListSerializer
