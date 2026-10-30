from rest_framework.routers import DefaultRouter

from .views import NewsCategoryViewSet, NewsPostViewSet
from .management_api import ManagedNewsViewSet
from .polls import ManagedPollViewSet, ClientPollViewSet
from .forms_api import ManagedFormViewSet, PublicFormViewSet

router = DefaultRouter()
router.register('forms/manage', ManagedFormViewSet, basename='form-manage')
router.register('forms', PublicFormViewSet, basename='form')
router.register('polls/manage', ManagedPollViewSet, basename='poll-manage')
router.register('polls', ClientPollViewSet, basename='poll')
router.register('manage', ManagedNewsViewSet, basename='news-manage')
router.register('categories', NewsCategoryViewSet, basename='news-categories')
router.register('', NewsPostViewSet, basename='news')

urlpatterns = router.urls
