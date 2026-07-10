from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import LoginView
from apps.common.views import developer_page, privacy_policy_page

urlpatterns = [
    path('favicon.ico', RedirectView.as_view(url=f'{settings.STATIC_URL}favicon.png', permanent=True)),
    path('admin/', admin.site.urls),
    path('privacy-policy/', privacy_policy_page, name='privacy-policy'),
    path('developer/', developer_page, name='developer-page'),

    path('api/v1/auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/staff/', include('apps.staff.urls')),
    path('api/v1/services/', include('apps.services.urls')),
    path('api/v1/locations/', include('apps.locations.urls')),
    path('api/v1/universities/', include('apps.universities.urls')),
    path('api/v1/applications/', include('apps.applications.urls')),
    path('api/v1/news/', include('apps.news.urls')),
    path('api/v1/knowledge/', include('apps.knowledge_base.urls')),
    path('api/v1/chat/', include('apps.chat.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/questionnaire/', include('apps.questionnaires.urls')),
    path('api/v1/common/', include('apps.common.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
