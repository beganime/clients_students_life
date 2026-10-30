from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory
from .management_api import ManagedNewsViewSet
from .models import NewsPost
from .views import NewsPostViewSet
from tempfile import TemporaryDirectory
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile


@override_settings(STUDENTS_LIFE_API_KEY='isolated-test-key')
class NewsManagementTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        directory = TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        media = override_settings(MEDIA_ROOT=directory.name)
        media.enable()
        self.addCleanup(media.disable)

    def banner(self):
        buffer = BytesIO()
        Image.new('RGB', (16, 9)).save(buffer, format='PNG')
        return SimpleUploadedFile('banner.png', buffer.getvalue(), content_type='image/png')

    def request(self, method, action, data=None, pk=None, key='isolated-test-key'):
        request = getattr(self.factory, method)('/news/manage/', data or {}, format='multipart' if data and data.get('cover_image') else 'json', HTTP_X_API_KEY=key)
        return ManagedNewsViewSet.as_view({method: action})(request, **({'pk': pk} if pk else {}))

    def test_no_anonymous_write(self):
        self.assertEqual(self.request('post', 'create', {'title': 'No'}, key='').status_code, 403)

    def test_lifecycle_and_duplicate_title(self):
        first = self.request('post', 'create', {'title': 'Одинаковое название', 'status': 'draft', 'cover_image': self.banner()})
        second = self.request('post', 'create', {'title': 'Одинаковое название', 'cover_image': self.banner()})
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertNotEqual(first.data['slug'], second.data['slug'])
        public = NewsPostViewSet.as_view({'get': 'list'})
        self.assertEqual(public(self.factory.get('/news/')).data['count'], 0)
        self.assertEqual(self.request('patch', 'partial_update', {'status': 'published'}, first.data['id']).status_code, 200)
        self.assertEqual(public(self.factory.get('/news/')).data['count'], 1)
        self.request('patch', 'partial_update', {'status': 'hidden'}, first.data['id'])
        self.assertEqual(public(self.factory.get('/news/')).data['count'], 0)
        self.assertEqual(self.request('delete', 'destroy', pk=first.data['id']).status_code, 204)
        self.assertFalse(NewsPost.objects.filter(pk=first.data['id']).exists())

    def test_banner_required_and_cannot_be_cleared(self):
        response = self.request('post', 'create', {'title': 'Без баннера'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('cover_image', response.data)
        created = self.request('post', 'create', {'title': 'С баннером', 'cover_image': self.banner()})
        self.assertEqual(self.request('patch', 'partial_update', {'cover_image': None}, created.data['id']).status_code, 400)
