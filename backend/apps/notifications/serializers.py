from rest_framework import serializers

from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Matches TypeScript `NotificationItem` exactly."""

    createdAt = serializers.CharField(read_only=True)
    linkNav = serializers.CharField(read_only=True)
    linkId = serializers.CharField(read_only=True)
    senderId = serializers.CharField(read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "type",
            "title",
            "body",
            "createdAt",
            "read",
            "linkNav",
            "linkId",
            "senderId",
        )


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ("email_digest", "sound_alerts", "muted_channels", "dnd_enabled")
