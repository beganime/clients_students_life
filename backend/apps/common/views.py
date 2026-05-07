from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AppSetting, HomeBanner, OfficeContact
from .serializers import AppSettingSerializer, HomeBannerSerializer, OfficeContactSerializer


class AppSettingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AppSettingSerializer
    queryset = AppSetting.objects.all().order_by('key')
    lookup_field = 'key'
    permission_classes = [permissions.AllowAny]


class HomeContentView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        hero_banners = (
            HomeBanner.objects
            .filter(is_active=True, slot=HomeBanner.Slot.HERO)
            .select_related('linked_news', 'linked_service', 'linked_university')
            .order_by('sort_order', '-created_at')[:3]
        )

        news_banners = (
            HomeBanner.objects
            .filter(is_active=True, slot=HomeBanner.Slot.NEWS)
            .select_related('linked_news', 'linked_service', 'linked_university')
            .order_by('sort_order', '-created_at')[:3]
        )

        contacts = (
            OfficeContact.objects
            .filter(is_active=True)
            .order_by('sort_order', 'country', 'city')
        )

        settings = {item.key: item.value for item in AppSetting.objects.all()}

        return Response({
            'hero_banners': HomeBannerSerializer(
                hero_banners,
                many=True,
                context={'request': request},
            ).data,
            'news_banners': HomeBannerSerializer(
                news_banners,
                many=True,
                context={'request': request},
            ).data,
            'contacts': OfficeContactSerializer(
                contacts,
                many=True,
                context={'request': request},
            ).data,
            'socials': {
                'instagram': settings.get('instagram', ''),
                'tiktok': settings.get('tiktok', ''),
                'telegram': settings.get('telegram', ''),
                'website': settings.get('website', ''),
                'main_email': settings.get('main_email', ''),
                'partners_email': settings.get('partners_email', ''),
                'universities_email': settings.get('universities_email', ''),
            },
        })


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