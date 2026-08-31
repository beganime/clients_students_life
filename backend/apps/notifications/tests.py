from datetime import date, time

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ClientExam, UserNotification


User = get_user_model()


@override_settings(STUDENTS_LIFE_API_KEY='exam-service-test-key')
class ServiceExamUpsertTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='SL-2027-001', password='Test_0710')
        self.client = APIClient()
        self.client.credentials(HTTP_X_API_KEY='exam-service-test-key')
        self.url = f'/api/v1/notifications/clients/{self.user.pk}/exams/'
        self.payload = {
            'subject': 'Русский язык',
            'exam_date': '2027-06-10',
            'exam_time': '10:30:00',
            'timezone': 'Asia/Ashgabat',
            'comment': 'КФУ',
            'manager_sl_exam_id': 'EXAM-001',
        }

    def test_repeated_sync_updates_one_exam_without_duplicate_notification(self):
        first = self.client.post(self.url, self.payload, format='json')
        second = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(ClientExam.objects.count(), 1)
        self.assertEqual(UserNotification.objects.count(), 1)
        self.assertEqual(second.json()['sync_status'], 'updated')

    def test_schedule_change_resets_acknowledgement_and_notifies_again(self):
        self.client.post(self.url, self.payload, format='json')
        exam = ClientExam.objects.get()
        exam.mark_acknowledged()

        changed = {**self.payload, 'exam_time': '12:00:00'}
        response = self.client.post(self.url, changed, format='json')
        exam.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(exam.exam_date, date(2027, 6, 10))
        self.assertEqual(exam.exam_time, time(12, 0))
        self.assertFalse(exam.acknowledged_by_user)
        self.assertEqual(UserNotification.objects.count(), 2)
