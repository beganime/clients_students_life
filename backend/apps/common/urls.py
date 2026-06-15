from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AppSettingViewSet, HomeContentView, PrivacyPolicyView, app_config

router = DefaultRouter()
router.register('settings', AppSettingViewSet, basename='settings')

urlpatterns = [
    path('app-config/', app_config, name='app-config'),
    path('home/', HomeContentView.as_view(), name='home-content'),
    path('privacy-policy/', PrivacyPolicyView.as_view(), name='privacy-policy-api'),
]

urlpatterns += router.urls
