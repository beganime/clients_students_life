from django.urls import path

from .views import (
    ActivityView,
    LogoutView,
    ManagerClientProfileDetailView,
    ManagerClientProfileListView,
    ManagerUserDetailView,
    ManagerUsersListView,
    MeView,
    RegisterView,
    StaffLoginView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('staff-login/', StaffLoginView.as_view(), name='staff-login'),
    path('manager-login/', StaffLoginView.as_view(), name='manager-login'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', ManagerUsersListView.as_view(), name='users-list'),
    path('users/<int:user_id>/', ManagerUserDetailView.as_view(), name='users-detail'),
    path('client-profiles/', ManagerClientProfileListView.as_view(), name='client-profiles-list'),
    path('client-profiles/<int:profile_id>/', ManagerClientProfileDetailView.as_view(), name='client-profiles-detail'),
    path('activity/', ActivityView.as_view(), name='activity'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
