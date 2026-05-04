from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse, Http404

from .models import Application, ApplicationFile
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationDetailSerializer,
    ApplicationFileSerializer,
    ApplicationListSerializer,
)


class ApplicationViewSet(mixins.CreateModelMixin,
                         mixins.ListModelMixin,
                         mixins.RetrieveModelMixin,
                         viewsets.GenericViewSet):
    filterset_fields = ('status', 'service', 'target_country', 'target_university')
    search_fields = ('application_number', 'full_name', 'phone', 'whatsapp', 'telegram', 'email')
    ordering_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = (
            Application.objects
            .select_related('service', 'assigned_manager', 'target_country', 'target_city', 'target_university', 'target_program')
            .prefetch_related('files')
        )
        if self.request.user.is_staff:
            return qs
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        if self.action == 'retrieve':
            return ApplicationDetailSerializer
        return ApplicationListSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(
            user=user,
            source='mobile_app',
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            device_platform=self.request.headers.get('X-Device-Platform', ''),
        )

    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return self.request.META.get('REMOTE_ADDR')

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my(self, request):
        queryset = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ApplicationListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ApplicationListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_file(self, request, pk=None):
        application = self.get_object()
        serializer = ApplicationFileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        uploaded_file = request.FILES.get('file')
        serializer.save(
            application=application,
            uploaded_by=request.user,
            original_name=uploaded_file.name if uploaded_file else '',
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ApplicationFileViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ApplicationFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ApplicationFile.objects.select_related('application', 'uploaded_by')
        if self.request.user.is_staff:
            return qs
        return qs.filter(application__user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file_obj = self.get_object()
        if not file_obj.file:
            raise Http404
        return FileResponse(file_obj.file.open('rb'), as_attachment=True, filename=file_obj.original_name or file_obj.file.name)