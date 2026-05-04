from rest_framework.routers import DefaultRouter

from .views import NewsCategoryViewSet, NewsPostViewSet

router = DefaultRouter()
router.register('categories', NewsCategoryViewSet, basename='news-categories')
router.register('', NewsPostViewSet, basename='news')

urlpatterns = router.urls