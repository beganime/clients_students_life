from django.shortcuts import redirect
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ensure_client_profile

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


class MyQuestionnaireView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        questionnaire = get_or_create_questionnaire(request.user)
        serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        questionnaire = get_or_create_questionnaire(request.user)
        serializer = ApplicantQuestionnaireUpdateSerializer(
            questionnaire,
            data=request.data,
            partial=True,
            context={'request': request, 'require_consent': False},
        )
        serializer.is_valid(raise_exception=True)
        questionnaire = serializer.save()
        questionnaire.manager_sl_sync_status = 'pending'
        questionnaire.save(update_fields=['manager_sl_sync_status', 'updated_at'])
        response_serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(response_serializer.data)

    def post(self, request):
        return self.patch(request)


class MyQuestionnaireSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        questionnaire = get_or_create_questionnaire(request.user)
        serializer = ApplicantQuestionnaireUpdateSerializer(
            questionnaire,
            data=request.data,
            partial=True,
            context={'request': request, 'require_consent': True},
        )
        serializer.is_valid(raise_exception=True)
        questionnaire = serializer.save()
        questionnaire.mark_submitted()
        questionnaire.save()
        sync_questionnaire_to_manager_sl(questionnaire, request=request)
        response_serializer = ApplicantQuestionnaireSerializer(questionnaire, context={'request': request})
        return Response(response_serializer.data)


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
        if questionnaire.manager_sl_document_url:
            return redirect(questionnaire.manager_sl_document_url)
        return Response({'detail': 'Документ анкеты еще не сформирован.'}, status=status.HTTP_404_NOT_FOUND)
