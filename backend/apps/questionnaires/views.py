from django.http import FileResponse
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ensure_client_profile
from apps.documents.views import has_manager_or_service_access, has_service_api_access
from apps.notifications.services import send_push_to_user

from .labels import questionnaire_field_labels
from .manager_sl_sync import sync_questionnaire_to_manager_sl
from .models import ApplicantQuestionnaire
from .serializers import (
    ApplicantQuestionnaireSerializer,
    ApplicantQuestionnaireUpdateSerializer,
    QuestionnaireAttachmentSerializer,
    QuestionnaireAttachmentUploadSerializer,
)


def get_or_create_questionnaire(user):
    ensure_client_profile(user)
    questionnaire, _ = ApplicantQuestionnaire.objects.get_or_create(
        user=user,
        defaults={
            'full_name': user.get_full_name(),
            'email': user.email or '',
        },
    )
    profile = getattr(user, 'client_profile', None)
    if profile:
        updates = []
        defaults = {
            'phone': getattr(profile, 'phone', ''),
            'telegram': getattr(profile, 'telegram', ''),
            'citizenship': getattr(profile, 'citizenship', ''),
            'residence_country': getattr(profile, 'country', ''),
            'residence_city': getattr(profile, 'city', ''),
        }
        for field, value in defaults.items():
            if value and not getattr(questionnaire, field):
                setattr(questionnaire, field, value)
                updates.append(field)
        if updates:
            updates.append('updated_at')
            questionnaire.save(update_fields=updates)
    return questionnaire


def save_questionnaire_payload(request, data, save_mode='draft'):
    questionnaire = get_or_create_questionnaire(request.user)
    previous_status = questionnaire.status
    mutable = data.copy() if hasattr(data, 'copy') else dict(data)
    mutable['save_mode'] = save_mode
    serializer = ApplicantQuestionnaireUpdateSerializer(
        questionnaire,
        data=mutable,
        partial=True,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    questionnaire = serializer.save()
    if save_mode == 'draft':
        questionnaire.mark_draft()
        questionnaire.save()
        if previous_status in {
            ApplicantQuestionnaire.Status.SUBMITTED,
            ApplicantQuestionnaire.Status.APPROVED,
            ApplicantQuestionnaire.Status.REJECTED,
            ApplicantQuestionnaire.Status.UPDATED,
        }:
            questionnaire.status = ApplicantQuestionnaire.Status.UPDATED
            questionnaire.save(update_fields=['status', 'updated_at'])
        return questionnaire, None

    missing_fields = questionnaire.missing_required_fields()
    if 'data_processing_consent' in missing_fields:
        return questionnaire, {
            'detail': 'Перед отправкой анкеты подтвердите согласие на обработку персональных данных.',
            'missing_fields': ['data_processing_consent'],
            'missing_required_fields': ['data_processing_consent'],
            'missing_field_labels': questionnaire_field_labels(['data_processing_consent']),
            'missing_required_field_labels': questionnaire_field_labels(['data_processing_consent']),
        }

    questionnaire.mark_submitted()
    if not missing_fields:
        questionnaire.generate_document()
    questionnaire.save()
    sync_questionnaire_to_manager_sl(questionnaire, request=request)
    return questionnaire, None


def resolve_questionnaire_reviewer_metadata(request=None, reviewer=None):
    if reviewer and getattr(reviewer, 'is_authenticated', False):
        return (
            reviewer,
            reviewer.get_full_name().strip() or reviewer.email or reviewer.username,
            reviewer.email or '',
        )

    request_data = getattr(request, 'data', {}) if request is not None else {}
    reviewer_name = (
        request_data.get('reviewed_by_name')
        or request_data.get('manager_name')
        or request_data.get('reviewer_name')
        or ''
    )
    reviewer_email = (
        request_data.get('reviewed_by_email')
        or request_data.get('manager_email')
        or request_data.get('reviewer_email')
        or ''
    )
    return None, str(reviewer_name).strip(), str(reviewer_email).strip()


def send_questionnaire_review_notification(questionnaire):
    if questionnaire.status == ApplicantQuestionnaire.Status.APPROVED:
        title = 'Анкета принята'
        body = 'Ваша анкета успешно проверена и принята.'
    elif questionnaire.status == ApplicantQuestionnaire.Status.REJECTED:
        title = 'Анкета требует правок'
        body = 'Ваша анкета не принята. Откройте анкету, чтобы посмотреть комментарий менеджера.'
    else:
        return

    send_push_to_user(
        user=questionnaire.user,
        title=title,
        body=body,
        notification_type='questionnaire_review',
        related_object_type='applicant_questionnaire',
        related_object_id=questionnaire.id,
    )


def review_questionnaire(questionnaire, status_value, request=None, reviewer=None, comment=''):
    allowed_statuses = {
        ApplicantQuestionnaire.Status.APPROVED,
        ApplicantQuestionnaire.Status.REJECTED,
        ApplicantQuestionnaire.Status.SUBMITTED,
        ApplicantQuestionnaire.Status.UPDATED,
        ApplicantQuestionnaire.Status.DRAFT,
    }
    if status_value not in allowed_statuses:
        return {'status': 'Invalid questionnaire status.'}
    if status_value == ApplicantQuestionnaire.Status.REJECTED and not str(comment or '').strip():
        return {'comment': 'Укажите причину отклонения анкеты.'}

    reviewer_obj, reviewer_name, reviewer_email = resolve_questionnaire_reviewer_metadata(
        request=request,
        reviewer=reviewer,
    )
    questionnaire.status = status_value
    questionnaire.reviewed_by = reviewer_obj
    questionnaire.reviewed_by_name = reviewer_name
    questionnaire.reviewed_by_email = reviewer_email
    questionnaire.reviewed_at = timezone.now() if status_value in {
        ApplicantQuestionnaire.Status.APPROVED,
        ApplicantQuestionnaire.Status.REJECTED,
    } else None
    questionnaire.review_comment = '' if status_value == ApplicantQuestionnaire.Status.APPROVED else str(comment or '').strip()
    questionnaire.manager_sl_sync_status = 'pending'
    questionnaire.save(
        update_fields=[
            'status',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_by_email',
            'reviewed_at',
            'review_comment',
            'manager_sl_sync_status',
            'updated_at',
        ]
    )
    sync_questionnaire_to_manager_sl(questionnaire, request=request)
    send_questionnaire_review_notification(questionnaire)
    return None


class MyQuestionnaireView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        questionnaire = get_or_create_questionnaire(request.user)
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        save_mode = request.data.get('save_mode') or 'draft'
        questionnaire, errors = save_questionnaire_payload(request, request.data, save_mode=save_mode)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        response_serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(response_serializer.data)

    def post(self, request):
        return self.patch(request)


class MyQuestionnaireSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        questionnaire, errors = save_questionnaire_payload(request, request.data, save_mode='submitted')
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        response_serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(response_serializer.data)


class MyQuestionnaireDraftView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def patch(self, request):
        questionnaire, errors = save_questionnaire_payload(request, request.data, save_mode='draft')
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)


class MyQuestionnaireRegenerateDocumentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        questionnaire = get_or_create_questionnaire(request.user)
        missing_fields = questionnaire.missing_required_fields()
        if missing_fields:
            return Response(
                {
                    'detail': 'Документ можно сформировать после заполнения обязательных полей.',
                    'missing_fields': missing_fields,
                    'missing_required_fields': missing_fields,
                    'missing_field_labels': questionnaire_field_labels(missing_fields),
                    'missing_required_field_labels': questionnaire_field_labels(missing_fields),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        questionnaire.generate_document()
        questionnaire.save(update_fields=['generated_document', 'generated_document_at', 'manager_sl_sync_status', 'updated_at'])
        sync_questionnaire_to_manager_sl(questionnaire, request=request)
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)


class ServiceQuestionnaireRegenerateDocumentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, questionnaire_id):
        if not has_service_api_access(request):
            return Response({'detail': 'Invalid API key.'}, status=status.HTTP_403_FORBIDDEN)
        questionnaire = ApplicantQuestionnaire.objects.select_related('user').filter(pk=questionnaire_id).first()
        if not questionnaire:
            return Response({'detail': 'Questionnaire not found.'}, status=status.HTTP_404_NOT_FOUND)
        missing_fields = questionnaire.missing_required_fields()
        if missing_fields:
            return Response(
                {
                    'detail': 'Документ можно сформировать после заполнения обязательных полей.',
                    'missing_fields': missing_fields,
                    'missing_required_fields': missing_fields,
                    'missing_field_labels': questionnaire_field_labels(missing_fields),
                    'missing_required_field_labels': questionnaire_field_labels(missing_fields),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        questionnaire.generate_document()
        questionnaire.save(update_fields=['generated_document', 'generated_document_at', 'manager_sl_sync_status', 'updated_at'])
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)


class ServiceQuestionnaireApproveView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, questionnaire_id):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        questionnaire = ApplicantQuestionnaire.objects.select_related('user', 'reviewed_by').filter(pk=questionnaire_id).first()
        if not questionnaire:
            return Response({'detail': 'Questionnaire not found.'}, status=status.HTTP_404_NOT_FOUND)
        error = review_questionnaire(
            questionnaire,
            ApplicantQuestionnaire.Status.APPROVED,
            request=request,
            reviewer=request.user,
        )
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)


class ServiceQuestionnaireRejectView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, questionnaire_id):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        questionnaire = ApplicantQuestionnaire.objects.select_related('user', 'reviewed_by').filter(pk=questionnaire_id).first()
        if not questionnaire:
            return Response({'detail': 'Questionnaire not found.'}, status=status.HTTP_404_NOT_FOUND)
        error = review_questionnaire(
            questionnaire,
            ApplicantQuestionnaire.Status.REJECTED,
            request=request,
            reviewer=request.user,
            comment=request.data.get('comment') or request.data.get('review_comment') or '',
        )
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)


class ServiceQuestionnaireStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, questionnaire_id):
        if not has_manager_or_service_access(request):
            return Response({'detail': 'Manager or service access required.'}, status=status.HTTP_403_FORBIDDEN)
        questionnaire = ApplicantQuestionnaire.objects.select_related('user', 'reviewed_by').filter(pk=questionnaire_id).first()
        if not questionnaire:
            return Response({'detail': 'Questionnaire not found.'}, status=status.HTTP_404_NOT_FOUND)
        error = review_questionnaire(
            questionnaire,
            request.data.get('status'),
            request=request,
            reviewer=request.user,
            comment=request.data.get('comment') or request.data.get('review_comment') or '',
        )
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)


class MyQuestionnaireAttachmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [FormParser, MultiPartParser]

    def post(self, request):
        questionnaire = get_or_create_questionnaire(request.user)
        serializer = QuestionnaireAttachmentUploadSerializer(
            data=request.data,
            context={'questionnaire': questionnaire, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        attachment = serializer.save()
        questionnaire.manager_sl_sync_status = 'pending'
        questionnaire.save(update_fields=['manager_sl_sync_status', 'updated_at'])
        return Response(
            QuestionnaireAttachmentSerializer(attachment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyQuestionnaireDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        questionnaire = get_or_create_questionnaire(request.user)
        if questionnaire.generated_document:
            return FileResponse(
                questionnaire.generated_document.open('rb'),
                as_attachment=True,
                filename=questionnaire.generated_document.name.rsplit('/', 1)[-1],
            )
        if questionnaire.manager_sl_document_url:
            return redirect(questionnaire.manager_sl_document_url)
        return Response({'detail': 'Документ анкеты еще не сформирован.'}, status=status.HTTP_404_NOT_FOUND)
