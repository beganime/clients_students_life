from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AppSettingViewSet, app_config

router = DefaultRouter()
router.register('settings', AppSettingViewSet, basename='settings')

urlpatterns = [
    path('app-config/', app_config, name='app-config'),
]

urlpatterns += router.urls