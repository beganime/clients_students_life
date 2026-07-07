from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (
    DeviceTokenViewSet,
    MyExamAcknowledgeView,
    MyExamListView,
    PushNotificationViewSet,
    ServiceClientExamDetailView,
    ServiceClientExamListCreateView,
    UserNotificationViewSet,
)

router = DefaultRouter()
router.register('device-tokens', DeviceTokenViewSet, basename='device-tokens')
router.register('my', UserNotificationViewSet, basename='my-notifications')
router.register('', PushNotificationViewSet, basename='notifications')

urlpatterns = [
    path('my-exams/', MyExamListView.as_view(), name='my-exams'),
    path('my-exams/<int:exam_id>/acknowledge/', MyExamAcknowledgeView.as_view(), name='my-exam-acknowledge'),
    path('exam-reminders/<int:exam_id>/acknowledge/', MyExamAcknowledgeView.as_view(), name='exam-reminder-acknowledge'),
    path('clients/<int:client_id>/exams/', ServiceClientExamListCreateView.as_view(), name='service-client-exams'),
    path('exams/<int:exam_id>/', ServiceClientExamDetailView.as_view(), name='service-client-exam-detail'),
    *router.urls,
]
