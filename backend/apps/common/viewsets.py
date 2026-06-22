from django.shortcuts import get_object_or_404


class IdOrSlugLookupMixin:
    lookup_field = 'slug'

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)

        obj = None
        if str(lookup_value).isdigit():
            obj = queryset.filter(pk=int(lookup_value)).first()

        if obj is None:
            obj = get_object_or_404(queryset, **{self.lookup_field: lookup_value})

        self.check_object_permissions(self.request, obj)
        return obj
