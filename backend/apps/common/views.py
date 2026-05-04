from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import AppSetting
from .serializers import AppSettingSerializer


class AppSettingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AppSettingSerializer
    queryset = AppSetting.objects.all().order_by('key')
    lookup_field = 'key'
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def app_config(request):
    settings = {item.key: item.value for item in AppSetting.objects.all()}
    return Response({
        'app_name': settings.get('app_name', "Student's Life"),
        'support_phone': settings.get('support_phone', ''),
        'support_whatsapp': settings.get('support_whatsapp', ''),
        'support_telegram': settings.get('support_telegram', ''),
        'instagram': settings.get('instagram', ''),
        'tiktok': settings.get('tiktok', ''),
        'default_language': settings.get('default_language', 'ru'),
        'available_languages': ['ru', 'en', 'tk', 'uz'],
    })