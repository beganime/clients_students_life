from rest_framework.routers import DefaultRouter

from .views import ChatMessageViewSet, ChatRoomViewSet

router = DefaultRouter()
router.register('messages', ChatMessageViewSet, basename='chat-messages')
router.register('', ChatRoomViewSet, basename='chats')

urlpatterns = router.urls