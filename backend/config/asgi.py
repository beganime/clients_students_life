import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from django.conf import settings
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from apps.chat.middleware import JWTAuthMiddleware
from apps.chat.routing import websocket_urlpatterns

protocols = {
    'http': django_asgi_app,
}

if settings.CHAT_WEBSOCKET_ENABLED:
    protocols['websocket'] = JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    )

application = ProtocolTypeRouter(protocols)
