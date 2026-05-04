from rest_framework.routers import DefaultRouter

from .views import KnowledgeArticleViewSet, KnowledgeCategoryViewSet

router = DefaultRouter()
router.register('categories', KnowledgeCategoryViewSet, basename='knowledge-categories')
router.register('', KnowledgeArticleViewSet, basename='knowledge')

urlpatterns = router.urls