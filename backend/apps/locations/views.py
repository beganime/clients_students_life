from rest_framework import viewsets

from .models import City, Country, Office
from .serializers import CitySerializer, CountryDetailSerializer, CountryListSerializer, OfficeSerializer


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    search_fields = ('name', 'short_description', 'description_markdown')
    ordering_fields = ('sort_order', 'name', 'created_at')
    ordering = ('sort_order', 'name')

    def get_queryset(self):
        return Country.objects.filter(is_active=True).order_by('sort_order', 'name')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CountryDetailSerializer
        return CountryListSerializer


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    serializer_class = CitySerializer
    filterset_fields = ('country', 'country__slug')
    search_fields = ('name', 'country__name', 'description_markdown')
    ordering_fields = ('sort_order', 'name', 'created_at')
    ordering = ('country__name', 'sort_order', 'name')

    def get_queryset(self):
        return City.objects.filter(is_active=True).select_related('country')


class OfficeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OfficeSerializer
    filterset_fields = ('country', 'country__slug', 'city', 'city__slug')
    search_fields = ('title', 'address', 'phone', 'whatsapp', 'telegram')
    ordering_fields = ('sort_order', 'title', 'created_at')
    ordering = ('sort_order', 'title')

    def get_queryset(self):
        return Office.objects.filter(is_active=True).select_related('country', 'city')