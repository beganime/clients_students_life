from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.manager_sl_catalog import map_program, map_university, proxy_manager_sl_resource

from .models import FavoriteUniversity, Program, University
from .serializers import FavoriteUniversitySerializer, ProgramSerializer, UniversityDetailSerializer, UniversityListSerializer


class UniversityViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    filterset_fields = (
        'country',
        'country__slug',
        'city',
        'city__slug',
        'university_type',
        'partner_status',
        'recognized_status',
        'has_dormitory',
        'scholarship_available',
    )
    search_fields = (
        'name',
        'description_markdown',
        'languages',
        'education_levels',
        'programs__title',
        'programs__specialty',
    )
    ordering_fields = ('sort_order', 'name', 'created_at')
    ordering = ('sort_order', 'name')

    def manager_sl_params(self):
        params = self.request.query_params.copy()
        if params.get('country__slug') and not params.get('country'):
            params['country'] = params['country__slug']
        if params.get('city__slug') and not params.get('city'):
            params['city'] = params['city__slug']
        return params

    def list(self, request, *args, **kwargs):
        response = proxy_manager_sl_resource(request, 'universities', map_university, params=self.manager_sl_params())
        if response is not None:
            return response
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        response = proxy_manager_sl_resource(request, 'universities', map_university, pk=kwargs.get(self.lookup_field))
        if response is not None:
            return response
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_favorite(self, request, slug=None):
        university = self.get_object()
        favorite, created = FavoriteUniversity.objects.get_or_create(
            user=request.user,
            university=university,
        )
        if not created:
            favorite.delete()
            return Response({'is_favorite': False}, status=status.HTTP_200_OK)
        return Response({'is_favorite': True}, status=status.HTTP_201_CREATED)
    
    def get_queryset(self):
        return (
            University.objects
            .filter(is_active=True)
            .select_related('country', 'city')
            .prefetch_related('programs')
            .distinct()
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UniversityDetailSerializer
        return UniversityListSerializer


class ProgramViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProgramSerializer
    filterset_fields = (
        'university',
        'university__slug',
        'level',
        'language',
        'currency',
        'university__country',
        'university__country__slug',
        'university__city',
        'university__city__slug',
    )
    search_fields = ('title', 'faculty', 'specialty', 'requirements', 'university__name')
    ordering_fields = ('sort_order', 'title', 'tuition_fee', 'created_at')
    ordering = ('university__name', 'sort_order', 'title')

    def manager_sl_params(self):
        params = self.request.query_params.copy()
        if params.get('university__slug') and not params.get('university'):
            params['university'] = params['university__slug']
        if params.get('university__country__slug') and not params.get('country'):
            params['country'] = params['university__country__slug']
        if params.get('university__city__slug') and not params.get('city'):
            params['city'] = params['university__city__slug']
        if params.get('level') and not params.get('degree'):
            params['degree'] = params['level']
        return params

    def list(self, request, *args, **kwargs):
        response = proxy_manager_sl_resource(request, 'programs', map_program, params=self.manager_sl_params())
        if response is not None:
            return response
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        response = proxy_manager_sl_resource(request, 'programs', map_program, pk=kwargs.get(self.lookup_field, kwargs.get('pk')))
        if response is not None:
            return response
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        return (
            Program.objects
            .filter(is_active=True, university__is_active=True)
            .select_related('university', 'university__country', 'university__city')
        )
        
class FavoriteUniversityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FavoriteUniversitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            FavoriteUniversity.objects
            .filter(user=self.request.user)
            .select_related('university', 'university__country', 'university__city')
        )
