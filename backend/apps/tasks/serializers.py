from rest_framework import serializers

from .models import Task, TaskComment, TaskSubtask


class TaskSubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSubtask
        fields = ("id", "title", "completed")


class TaskCommentSerializer(serializers.ModelSerializer):
    userName = serializers.CharField(source="user.name", read_only=True)
    userAvatar = serializers.CharField(source="user.avatar", read_only=True)

    class Meta:
        model = TaskComment
        fields = ("id", "user", "userName", "userAvatar", "content", "created_at")
        read_only_fields = ("id", "user", "created_at")


class TaskSerializer(serializers.ModelSerializer):
    """Serializes Task matching TypeScript `Task` interface."""

    assigneeId = serializers.CharField(read_only=True)
    creatorId = serializers.CharField(read_only=True)
    dueDate = serializers.CharField(read_only=True)
    channelId = serializers.CharField(read_only=True)
    commentsCount = serializers.IntegerField(read_only=True)
    createdAt = serializers.CharField(read_only=True)
    subtasks = TaskSubtaskSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "assigneeId",
            "creatorId",
            "dueDate",
            "tags",
            "subtasks",
            "attachments",
            "commentsCount",
            "channelId",
            "order_index",
            "createdAt",
        )


class CreateUpdateTaskSerializer(serializers.ModelSerializer):
    assigneeId = serializers.CharField(required=False, allow_blank=True)
    channelId = serializers.CharField(required=False, allow_blank=True)
    dueDate = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "assigneeId",
            "channelId",
            "dueDate",
            "tags",
            "order_index",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        assignee_id = validated_data.pop("assigneeId", None)
        channel_id = validated_data.pop("channelId", None)
        due_date = validated_data.pop("dueDate", None)

        if assignee_id:
            validated_data["assignee_id"] = assignee_id
        if channel_id:
            validated_data["channel_id"] = channel_id
        if due_date:
            validated_data["due_date"] = due_date

        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "assigneeId" in validated_data:
            instance.assignee_id = validated_data.pop("assigneeId") or None
        if "channelId" in validated_data:
            instance.channel_id = validated_data.pop("channelId") or None
        if "dueDate" in validated_data:
            instance.due_date = validated_data.pop("dueDate") or None

        return super().update(instance, validated_data)
