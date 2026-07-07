from django.urls import path

from .views import (
    MyQuestionnaireAttachmentView,
    MyQuestionnaireDownloadView,
    MyQuestionnaireDraftView,
    MyQuestionnaireRegenerateDocumentView,
    MyQuestionnaireSubmitView,
    MyQuestionnaireView,
    ServiceQuestionnaireRegenerateDocumentView,
)


urlpatterns = [
    path('my/', MyQuestionnaireView.as_view(), name='my-questionnaire'),
    path('my/submit/', MyQuestionnaireSubmitView.as_view(), name='my-questionnaire-submit'),
    path('my/attachments/', MyQuestionnaireAttachmentView.as_view(), name='my-questionnaire-attachments'),
    path('my/download/', MyQuestionnaireDownloadView.as_view(), name='my-questionnaire-download'),
    path('my-application-form/', MyQuestionnaireView.as_view(), name='my-application-form'),
    path('my-application-form/draft/', MyQuestionnaireDraftView.as_view(), name='my-application-form-draft'),
    path('my-application-form/submit/', MyQuestionnaireSubmitView.as_view(), name='my-application-form-submit'),
    path('my-application-form/regenerate-document/', MyQuestionnaireRegenerateDocumentView.as_view(), name='my-application-form-regenerate-document'),
    path('my-application-form/document/', MyQuestionnaireDownloadView.as_view(), name='my-application-form-document'),
    path('application-forms/<int:questionnaire_id>/regenerate-document/', ServiceQuestionnaireRegenerateDocumentView.as_view(), name='service-application-form-regenerate-document'),
]
