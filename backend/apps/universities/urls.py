from rest_framework.routers import DefaultRouter

from .views import FavoriteUniversityViewSet, ProgramViewSet, UniversityViewSet

router = DefaultRouter()
router.register('favorites', FavoriteUniversityViewSet, basename='favorite-universities')
router.register('programs', ProgramViewSet, basename='programs')
router.register('', UniversityViewSet, basename='universities')

urlpatterns = router.urls