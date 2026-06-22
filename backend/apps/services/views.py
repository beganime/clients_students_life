from rest_framework import viewsets

from apps.common.manager_sl_catalog import map_service, proxy_manager_sl_resource
from apps.common.viewsets import IdOrSlugLookupMixin

from .models import Service
from .serializers import ServiceDetailSerializer, ServiceListSerializer


class ServiceViewSet(IdOrSlugLookupMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    search_fields = ('title', 'short_description', 'description_markdown')
    ordering_fields = ('sort_order', 'title', 'created_at')
    ordering = ('sort_order', 'title')

    def list(self, request, *args, **kwargs):
        response = proxy_manager_sl_resource(request, 'services', map_service)
        if response is not None:
            return response
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        response = proxy_manager_sl_resource(request, 'services', map_service, pk=kwargs.get(self.lookup_field))
        if response is not None:
            return response
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        return Service.objects.filter(is_active=True).order_by('sort_order', 'title')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ServiceDetailSerializer
        return ServiceListSerializer
