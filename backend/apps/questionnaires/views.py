from django.http import FileResponse
from django.shortcuts import redirect
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ensure_client_profile
from apps.documents.views import configured_review_api_keys

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
    if missing_fields:
        return questionnaire, {
            'detail': 'Заполните обязательные поля перед отправкой анкеты.',
            'missing_fields': missing_fields,
            'missing_required_fields': missing_fields,
        }
    questionnaire.mark_submitted()
    questionnaire.generate_document()
    questionnaire.save()
    sync_questionnaire_to_manager_sl(questionnaire, request=request)
    return questionnaire, None


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
        if request.headers.get('X-API-KEY') not in configured_review_api_keys():
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
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        questionnaire.generate_document()
        questionnaire.save(update_fields=['generated_document', 'generated_document_at', 'manager_sl_sync_status', 'updated_at'])
        sync_questionnaire_to_manager_sl(questionnaire, request=request)
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
