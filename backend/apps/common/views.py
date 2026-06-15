from django.http import HttpResponse
from django.utils.html import escape
from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AppSetting, HomeBanner, OfficeContact, PrivacyPolicy
from .serializers import AppSettingSerializer, HomeBannerSerializer, OfficeContactSerializer


DEFAULT_PRIVACY_POLICY = """Student's Life mobile app collects registration data, profile contacts, service application details, chat messages, push notification tokens, and limited activity data such as online status and last seen time.

We use this data to create and process applications, communicate with clients, provide manager support, send service notifications, improve the app experience, and keep application history available to registered users.

We do not ask users to submit passwords, access tokens, or payment secrets in chat. Push tokens are used only for notifications and can be refreshed or deactivated when a device changes.

Users can contact Student's Life to request updates or removal of their personal data where applicable."""


def get_active_privacy_policy():
    return PrivacyPolicy.objects.filter(is_active=True).order_by('-updated_at').first()


def privacy_policy_payload():
    policy = get_active_privacy_policy()
    if policy:
        return {
            'title': policy.title,
            'content': policy.content,
            'updated_at': policy.updated_at,
        }
    return {
        'title': 'Privacy Policy',
        'content': DEFAULT_PRIVACY_POLICY,
        'updated_at': None,
    }


def privacy_policy_page(request):
    payload = privacy_policy_payload()
    content_html = ''.join(f'<p>{escape(part)}</p>' for part in payload['content'].splitlines() if part.strip())
    html = f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(payload['title'])}</title>
  <style>
    body {{ margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f4f7fb; color: #101828; }}
    main {{ max-width: 760px; margin: 0 auto; padding: 40px 20px; }}
    h1 {{ color: #e53935; font-size: 34px; line-height: 1.15; }}
    p {{ font-size: 16px; line-height: 1.65; }}
  </style>
</head>
<body>
  <main>
    <h1>{escape(payload['title'])}</h1>
    {content_html}
  </main>
</body>
</html>"""
    return HttpResponse(html)


class AppSettingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AppSettingSerializer
    queryset = AppSetting.objects.all().order_by('key')
    lookup_field = 'key'
    permission_classes = [permissions.AllowAny]


class PrivacyPolicyView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(privacy_policy_payload())


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
