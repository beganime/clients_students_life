from django.urls import path

from .views import ActivityView, LogoutView, MeView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('activity/', ActivityView.as_view(), name='activity'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
