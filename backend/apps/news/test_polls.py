from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from .models import ClientPoll, PollVote


@override_settings(STUDENTS_LIFE_API_KEY='isolated-poll-key')
class PollTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = get_user_model().objects.create_user(username='poll-test')
        self.poll = ClientPoll.objects.create(question='Куда поступаете?', options=['Россия', 'Китай'], status='published')
        self.url = f'/api/v1/news/polls/{self.poll.pk}/vote/'

    def vote(self, choice):
        return self.api.post(self.url, {'choice': choice}, format='json')

    def test_auth_required(self):
        self.assertIn(self.vote(0).status_code, (401, 403))
        self.assertEqual(self.api.post('/api/v1/news/polls/manage/', {}, format='json').status_code, 403)

    def test_one_vote_and_retry_idempotency(self):
        self.api.force_authenticate(self.user)
        self.assertEqual(self.vote(0).status_code, 200)
        self.assertEqual(self.vote(0).status_code, 200)
        self.assertEqual(self.vote(1).status_code, 409)
        self.assertEqual(PollVote.objects.count(), 1)
        self.assertEqual(self.vote(0).data['counts'], [1, 0])

    def test_invalid_choices_and_closed(self):
        self.api.force_authenticate(self.user)
        for choice in (-1, 2, True, '1', None):
            self.assertEqual(self.vote(choice).status_code, 400)
        self.poll.status = 'closed'; self.poll.save()
        self.assertEqual(self.vote(0).status_code, 400)

    def test_drafts_hidden_and_no_other_users_choice(self):
        ClientPoll.objects.create(question='Draft', options=['A', 'B'])
        PollVote.objects.create(poll=self.poll, user=self.user, choice=1)
        other = get_user_model().objects.create_user(username='other-poll-test')
        self.api.force_authenticate(other)
        result = self.api.get('/api/v1/news/polls/').data
        self.assertEqual(result['count'], 1)
        self.assertIsNone(result['results'][0]['my_choice'])

    def test_service_create_limits_and_freeze_after_vote(self):
        headers = {'HTTP_X_API_KEY': 'isolated-poll-key'}
        url = '/api/v1/news/polls/manage/'
        for options in (['Only'], ['Same', 'same'], ['x' * 256, 'B'], list(map(str, range(11)))):
            self.assertEqual(self.api.post(url, {'question': 'Test', 'options': options}, format='json', **headers).status_code, 400)
        self.assertEqual(self.api.post(url, {'question': 'Test', 'options': ['A', 'B']}, format='json', **headers).status_code, 201)
        PollVote.objects.create(poll=self.poll, user=self.user, choice=1)
        detail = f'{url}{self.poll.pk}/'
        self.assertEqual(self.api.patch(detail, {'question': 'Changed'}, format='json', **headers).status_code, 400)
        self.assertEqual(self.api.patch(detail, {'status': 'closed'}, format='json', **headers).status_code, 200)
