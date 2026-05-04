from rest_framework.routers import DefaultRouter

from .views import ApplicationFileViewSet, ApplicationViewSet

router = DefaultRouter()
router.register('files', ApplicationFileViewSet, basename='application-files')
router.register('', ApplicationViewSet, basename='applications')

urlpatterns = router.urls