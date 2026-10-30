from django.db import transaction
from django.db.models import Count
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ClientPoll, PollVote
from .management_api import ContentServicePermission, NewsPagination


class PollSerializer(serializers.ModelSerializer):
    options = serializers.ListField(child=serializers.CharField(max_length=255), min_length=2, max_length=10)
    counts = serializers.SerializerMethodField()
    my_choice = serializers.SerializerMethodField()

    class Meta:
        model = ClientPoll
        fields = ('id', 'question', 'options', 'status', 'created_at', 'counts', 'my_choice')
        read_only_fields = ('id', 'created_at')

    def validate_options(self, value):
        if len({item.casefold() for item in value}) != len(value):
            raise serializers.ValidationError('Варианты не должны повторяться.')
        return value

    def validate(self, attrs):
        if self.instance and self.instance.votes.exists():
            for field in ('question', 'options'):
                if field in attrs and attrs[field] != getattr(self.instance, field):
                    raise serializers.ValidationError('После первого ответа вопрос и варианты менять нельзя.')
        return attrs

    def get_counts(self, obj):
        result = [0] * len(obj.options)
        for row in obj.votes.values('choice').annotate(total=Count('id')):
            if row['choice'] < len(result):
                result[row['choice']] = row['total']
        return result

    def get_my_choice(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return None
        return obj.votes.filter(user=user).values_list('choice', flat=True).first()


class ManagedPollViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    permission_classes = (ContentServicePermission,)
    serializer_class = PollSerializer
    pagination_class = NewsPagination
    queryset = ClientPoll.objects.order_by('-created_at', '-pk')
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        self.queryset = self.queryset.select_for_update()
        return super().partial_update(request, *args, **kwargs)


class ClientPollViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = PollSerializer
    pagination_class = NewsPagination
    queryset = ClientPoll.objects.filter(status__in=['published', 'closed']).order_by('-created_at', '-pk')

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def vote(self, request, pk=None):
        self.queryset = self.queryset.select_for_update()
        poll = self.get_object()
        choice = request.data.get('choice')
        if poll.status != 'published':
            return Response({'detail': 'Опрос закрыт.'}, status=400)
        if isinstance(choice, bool) or not isinstance(choice, int) or not 0 <= choice < len(poll.options):
            return Response({'detail': 'Выберите один из вариантов.'}, status=400)
        previous = PollVote.objects.filter(poll=poll, user=request.user).first()
        if previous and previous.choice != choice:
            return Response({'detail': 'Ваш ответ уже сохранён.'}, status=409)
        if not previous:
            PollVote.objects.create(poll=poll, user=request.user, choice=choice)
        return Response(self.get_serializer(poll).data)
