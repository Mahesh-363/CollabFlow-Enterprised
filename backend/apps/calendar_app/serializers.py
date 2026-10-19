from rest_framework import serializers

from .models import CalendarEvent, EventAttendee


class CalendarEventSerializer(serializers.ModelSerializer):
    """Matches TypeScript `CalendarEvent` interface."""

    startDate = serializers.CharField(read_only=True)
    startTime = serializers.CharField(read_only=True)
    endDate = serializers.CharField(read_only=True)
    endTime = serializers.CharField(read_only=True)
    allDay = serializers.BooleanField(read_only=True)
    meetingId = serializers.CharField(read_only=True)
    reminderMinutes = serializers.IntegerField(read_only=True)
    attendees = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = (
            "id",
            "title",
            "description",
            "startDate",
            "startTime",
            "endDate",
            "endTime",
            "allDay",
            "recurrence",
            "location",
            "meetingId",
            "attendees",
            "reminderMinutes",
            "category",
            "color",
        )

    def get_attendees(self, obj):
        return list(obj.attendees.values_list("id", flat=True))


class CreateUpdateCalendarEventSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source="start_date")
    startTime = serializers.CharField(source="start_time", default="09:00")
    endDate = serializers.DateField(source="end_date")
    endTime = serializers.CharField(source="end_time", default="10:00")
    allDay = serializers.BooleanField(source="all_day", default=False)
    meetingId = serializers.CharField(
        source="meeting_id", required=False, allow_blank=True, allow_null=True
    )
    reminderMinutes = serializers.IntegerField(source="reminder_minutes", default=15)
    attendees = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = CalendarEvent
        fields = (
            "title",
            "description",
            "startDate",
            "startTime",
            "endDate",
            "endTime",
            "allDay",
            "recurrence",
            "location",
            "meetingId",
            "reminderMinutes",
            "category",
            "color",
            "attendees",
        )

    def create(self, validated_data):
        attendees_ids = validated_data.pop("attendees", [])
        event = super().create(validated_data)
        if attendees_ids:
            from apps.accounts.models import User

            users = User.objects.filter(id__in=attendees_ids)
            for u in users:
                EventAttendee.objects.create(event=event, user=u)
        return event

    def update(self, instance, validated_data):
        attendees_ids = validated_data.pop("attendees", None)
        event = super().update(instance, validated_data)
        if attendees_ids is not None:
            EventAttendee.objects.filter(event=event).delete()
            from apps.accounts.models import User

            users = User.objects.filter(id__in=attendees_ids)
            for u in users:
                EventAttendee.objects.create(event=event, user=u)
        return event
