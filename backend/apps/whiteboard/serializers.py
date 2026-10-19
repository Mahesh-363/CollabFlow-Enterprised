from rest_framework import serializers

from .models import Whiteboard


class WhiteboardSerializer(serializers.ModelSerializer):
    createdByName = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = Whiteboard
        fields = ("id", "title", "snapshot_data", "createdByName", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
