from urllib.parse import urlsplit
from rest_framework import permissions, serializers, viewsets
from .models import ClientForm
from .management_api import ContentServicePermission, NewsPagination


def valid_google_form(value):
    try:
        url = urlsplit(value)
        return (url.scheme == 'https' and not url.username and not url.password and url.port in (None, 443)
                and ((url.hostname == 'forms.gle' and len(url.path.strip('/')) > 0)
                     or (url.hostname == 'docs.google.com' and url.path.startswith('/forms/d/') and url.path.endswith('/viewform'))))
    except ValueError:
        return False


class FormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientForm
        fields = ('id', 'title', 'description', 'form_url', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_form_url(self, value):
        if not valid_google_form(value):
            raise serializers.ValidationError('Нужна ссылка для заполнения Google Forms: https://forms.gle/... или https://docs.google.com/forms/d/.../viewform. Не ссылка редактирования.')
        return value


class ManagedFormViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    permission_classes = (ContentServicePermission,)
    serializer_class = FormSerializer
    pagination_class = NewsPagination
    queryset = ClientForm.objects.order_by('-created_at', '-pk')
    http_method_names = ['get', 'post', 'patch', 'head', 'options']


class PublicFormViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = ()
    permission_classes = (permissions.AllowAny,)
    serializer_class = FormSerializer
    pagination_class = NewsPagination
    queryset = ClientForm.objects.filter(status='published').order_by('-created_at', '-pk')
