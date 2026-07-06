from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExternalDocumentReviewView, MyDocumentViewSet, RequiredDocumentTypeViewSet, UserDocumentReviewViewSet

router = DefaultRouter()
router.register('my-documents', MyDocumentViewSet, basename='my-documents')
router.register('client-documents', UserDocumentReviewViewSet, basename='client-documents')
router.register('types', RequiredDocumentTypeViewSet, basename='document-types')

urlpatterns = [
    path('external-review/', ExternalDocumentReviewView.as_view(), name='external-document-review'),
    path('', include(router.urls)),
]
