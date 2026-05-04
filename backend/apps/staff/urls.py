from rest_framework.routers import DefaultRouter

from .views import StaffProfileViewSet

router = DefaultRouter()
router.register('', StaffProfileViewSet, basename='staff')

urlpatterns = router.urls