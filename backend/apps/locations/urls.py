from rest_framework.routers import DefaultRouter

from .views import CityViewSet, CountryViewSet, OfficeViewSet

router = DefaultRouter()
router.register('countries', CountryViewSet, basename='countries')
router.register('cities', CityViewSet, basename='cities')
router.register('offices', OfficeViewSet, basename='offices')

urlpatterns = router.urls