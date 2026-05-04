from rest_framework import serializers

from .models import StaffProfile


class StaffProfileSerializer(serializers.ModelSerializer):
    office_title = serializers.CharField(source='office.title', read_only=True)

    class Meta:
        model = StaffProfile
        fields = (
            'id',
            'full_name',
            'position',
            'office',
            'office_title',
            'avatar',
            'bio',
            'languages',
            'specialization',
            'phone',
            'whatsapp',
            'telegram',
            'show_contacts',
            'sort_order',
        )