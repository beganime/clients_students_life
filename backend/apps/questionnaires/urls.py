from django.urls import path

from .views import MyQuestionnaireAttachmentView, MyQuestionnaireDownloadView, MyQuestionnaireSubmitView, MyQuestionnaireView


urlpatterns = [
    path('my/', MyQuestionnaireView.as_view(), name='my-questionnaire'),
    path('my/submit/', MyQuestionnaireSubmitView.as_view(), name='my-questionnaire-submit'),
    path('my/attachments/', MyQuestionnaireAttachmentView.as_view(), name='my-questionnaire-attachments'),
    path('my/download/', MyQuestionnaireDownloadView.as_view(), name='my-questionnaire-download'),
]
