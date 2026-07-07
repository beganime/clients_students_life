from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ExternalDocumentReviewView,
    MyDocumentViewSet,
    RequiredDocumentTypeViewSet,
    UserDocumentApproveView,
    UserDocumentRejectView,
    UserDocumentReviewViewSet,
    UserDocumentStatusView,
)

router = DefaultRouter()
router.register('my-documents', MyDocumentViewSet, basename='my-documents')
router.register('client-documents', UserDocumentReviewViewSet, basename='client-documents')
router.register('types', RequiredDocumentTypeViewSet, basename='document-types')

urlpatterns = [
    path('external-review/', ExternalDocumentReviewView.as_view(), name='external-document-review'),
    path('<int:document_id>/approve/', UserDocumentApproveView.as_view(), name='document-approve'),
    path('<int:document_id>/reject/', UserDocumentRejectView.as_view(), name='document-reject'),
    path('<int:document_id>/status/', UserDocumentStatusView.as_view(), name='document-status'),
    path('', include(router.urls)),
]
