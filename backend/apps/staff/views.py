from rest_framework import viewsets

from .models import StaffProfile
from .serializers import StaffProfileSerializer


class StaffProfileViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StaffProfileSerializer
    filterset_fields = ('office', 'office__city', 'office__country')
    search_fields = ('full_name', 'position', 'languages', 'specialization', 'bio')
    ordering_fields = ('sort_order', 'full_name', 'created_at')
    ordering = ('sort_order', 'full_name')

    def get_queryset(self):
        return StaffProfile.objects.filter(is_active=True, is_public=True).select_related('office')