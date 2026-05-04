from rest_framework.routers import DefaultRouter

from .views import DeviceTokenViewSet, PushNotificationViewSet, UserNotificationViewSet

router = DefaultRouter()
router.register('device-tokens', DeviceTokenViewSet, basename='device-tokens')
router.register('my', UserNotificationViewSet, basename='my-notifications')
router.register('', PushNotificationViewSet, basename='notifications')

urlpatterns = router.urls