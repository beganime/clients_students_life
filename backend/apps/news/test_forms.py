from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from .models import ClientForm


@override_settings(STUDENTS_LIFE_API_KEY='isolated-forms-key')
class FormsTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.url = '/api/v1/news/forms/manage/'
        self.headers = {'HTTP_X_API_KEY': 'isolated-forms-key'}
        self.data = {'title': 'Test', 'form_url': 'https://forms.gle/Test123', 'status': 'published'}

    def test_management_protected(self):
        self.assertEqual(self.api.post(self.url, self.data).status_code, 403)

    def test_publish_edit_hide(self):
        result = self.api.post(self.url, self.data, **self.headers)
        self.assertEqual(result.status_code, 201)
        pk = result.data['id']
        self.assertEqual(self.api.get('/api/v1/news/forms/').data['count'], 1)
        self.assertEqual(self.api.patch(f'{self.url}{pk}/', {'title': 'Changed', 'status': 'closed'}, **self.headers).status_code, 200)
        self.assertEqual(self.api.get('/api/v1/news/forms/').data['count'], 0)
        self.assertEqual(self.api.get(f'/api/v1/news/forms/{pk}/').status_code, 404)
        self.assertEqual(ClientForm.objects.get(pk=pk).title, 'Changed')

    def test_reject_unsafe_and_editor_urls(self):
        for url in ('http://forms.gle/abc', 'https://evil.com/forms/d/1/viewform', 'https://forms.gle.evil.com/a', 'https://user@forms.gle/a', 'https://docs.google.com/forms/d/1/edit', 'javascript:alert(1)', 'https://forms.gle:444/a'):
            self.assertEqual(self.api.post(self.url, {**self.data, 'form_url': url}, **self.headers).status_code, 400, url)
        self.assertEqual(self.api.post(self.url, {**self.data, 'form_url': 'https://docs.google.com/forms/d/e/abc/viewform?usp=sf_link'}, **self.headers).status_code, 201)

    def test_draft_limits_and_public_read_only(self):
        self.assertEqual(self.api.post(self.url, {**self.data, 'title': 'x'*256}, **self.headers).status_code, 400)
        self.assertEqual(self.api.post(self.url, {**self.data, 'description': 'x'*1001}, **self.headers).status_code, 400)
        self.api.post(self.url, {**self.data, 'status': 'draft'}, **self.headers)
        self.assertEqual(self.api.get('/api/v1/news/forms/').data['count'], 0)
        self.assertEqual(self.api.post('/api/v1/news/forms/', self.data).status_code, 405)
