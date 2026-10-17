from rest_framework import serializers
from .models import Meeting, MeetingChatMessage


class MeetingChatMessageSerializer(serializers.ModelSerializer):
    userId = serializers.CharField(source='user_id', read_only=True)
    userName = serializers.CharField(source='userName', read_only=True)
    timestamp = serializers.DateTimeField(source='timestamp', format='iso-8601', read_only=True)

    class Meta:
        model = MeetingChatMessage
        fields = ('id', 'userId', 'userName', 'content', 'timestamp')


class MeetingSerializer(serializers.ModelSerializer):
    """Matches TypeScript `Meeting` interface."""
    scheduledAt = serializers.CharField(source='scheduledAt', read_only=True)
    durationMinutes = serializers.IntegerField(source='duration_minutes', read_only=True)
    hostId = serializers.CharField(source='hostId', read_only=True)
    participantIds = serializers.SerializerMethodField()
    meetingLink = serializers.CharField(source='meeting_link', read_only=True)
    isInstant = serializers.BooleanField(source='is_instant', read_only=True)
    actionItems = serializers.ListField(source='action_items', read_only=True)
    chatMessages = MeetingChatMessageSerializer(source='chat_messages', many=True, read_only=True)

    class Meta:
        model = Meeting
        fields = (
            'id',
            'title',
            'description',
            'scheduledAt',
            'durationMinutes',
            'hostId',
            'participantIds',
            'status',
            'meetingLink',
            'agenda',
            'isInstant',
            'notes',
            'actionItems',
            'chatMessages',
        )

    def get_participantIds(self, obj):
        return list(obj.participants.values_list('id', flat=True))


class CreateUpdateMeetingSerializer(serializers.ModelSerializer):
    scheduledAt = serializers.DateTimeField(source='scheduled_at')
    durationMinutes = serializers.IntegerField(source='duration_minutes', default=30)
    isInstant = serializers.BooleanField(source='is_instant', default=False)
    participantIds = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = Meeting
        fields = (
            'title',
            'description',
            'scheduledAt',
            'durationMinutes',
            'agenda',
            'isInstant',
            'notes',
            'participantIds',
        )

    def create(self, validated_data):
        import uuid
        p_ids = validated_data.pop('participantIds', [])
        is_instant = validated_data.get('is_instant', False)
        code = f"meet-{uuid.uuid4().hex[:6]}"
        validated_data['meeting_link'] = f"https://meet.collabflow.io/{code}"
        if is_instant:
            validated_data['status'] = 'live'

        meeting = super().create(validated_data)
        if p_ids:
            from apps.accounts.models import User
            users = User.objects.filter(id__in=p_ids)
            meeting.participants.set(users)
        return meeting
