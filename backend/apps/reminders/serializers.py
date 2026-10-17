from rest_framework import serializers
from .models import Reminder


class ReminderSerializer(serializers.ModelSerializer):
    """Matches TypeScript `Reminder` interface."""
    dueAt = serializers.CharField(source='dueAt', read_only=True)
    snoozeUntil = serializers.CharField(source='snoozeUntil', read_only=True)
    linkedType = serializers.CharField(source='linkedType', read_only=True)
    linkedId = serializers.CharField(source='linkedId', read_only=True)
    linkedTitle = serializers.CharField(source='linkedTitle', read_only=True)
    createdAt = serializers.CharField(source='createdAt', read_only=True)

    class Meta:
        model = Reminder
        fields = (
            'id',
            'title',
            'dueAt',
            'priority',
            'completed',
            'snoozeUntil',
            'linkedType',
            'linkedId',
            'linkedTitle',
            'createdAt',
        )


class CreateUpdateReminderSerializer(serializers.ModelSerializer):
    dueAt = serializers.DateTimeField(source='due_at')
    snoozeUntil = serializers.DateTimeField(source='snooze_until', required=False, allow_null=True)
    linkedType = serializers.CharField(source='linked_type', required=False, allow_blank=True, allow_null=True)
    linkedId = serializers.CharField(source='linked_id', required=False, allow_blank=True, allow_null=True)
    linkedTitle = serializers.CharField(source='linked_title', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Reminder
        fields = (
            'title',
            'dueAt',
            'priority',
            'completed',
            'snoozeUntil',
            'linkedType',
            'linkedId',
            'linkedTitle',
        )
