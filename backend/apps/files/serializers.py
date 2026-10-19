import os

from rest_framework import serializers

from .models import WorkspaceFile

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "md",
    "csv",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "webp",
    "ts",
    "tsx",
    "js",
    "jsx",
    "py",
    "json",
    "yaml",
    "yml",
    "sql",
    "html",
    "css",
    "mp4",
    "webm",
    "mov",
    "mp3",
    "wav",
    "zip",
    "tar",
    "gz",
    "7z",
}


class WorkspaceFileSerializer(serializers.ModelSerializer):
    """Matches TypeScript `WorkspaceFile` interface."""

    size = serializers.CharField(read_only=True)
    sizeBytes = serializers.IntegerField(read_only=True)
    type = serializers.CharField(read_only=True)
    url = serializers.CharField(read_only=True)
    uploadedBy = serializers.CharField(read_only=True)
    uploadedAt = serializers.CharField(read_only=True)
    channelId = serializers.CharField(read_only=True)
    taskId = serializers.CharField(read_only=True)

    class Meta:
        model = WorkspaceFile
        fields = (
            "id",
            "name",
            "size",
            "sizeBytes",
            "type",
            "url",
            "uploadedBy",
            "uploadedAt",
            "channelId",
            "taskId",
        )


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    channelId = serializers.CharField(required=False, allow_blank=True)
    taskId = serializers.CharField(required=False, allow_blank=True)

    def validate_file(self, value):
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB."
            )

        ext = os.path.splitext(value.name)[1].lower().lstrip(".")
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(f"Extension .{ext} is not allowed.")

        return value
