from rest_framework import viewsets

from .models import Service
from .serializers import ServiceDetailSerializer, ServiceListSerializer


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    search_fields = ('title', 'short_description', 'description_markdown')
    ordering_fields = ('sort_order', 'title', 'created_at')
    ordering = ('sort_order', 'title')

    def get_queryset(self):
        return Service.objects.filter(is_active=True).order_by('sort_order', 'title')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ServiceDetailSerializer
        return ServiceListSerializer