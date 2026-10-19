import uuid

from django.db import models

from apps.accounts.models import User
from apps.workspaces.models import Workspace


def generate_whiteboard_id() -> str:
    return f"wb-{uuid.uuid4().hex[:8]}"


class Whiteboard(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_whiteboard_id)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="whiteboards")
    title = models.CharField(max_length=255, default="Sprint Architecture Canvas")
    snapshot_data = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "collab_whiteboards"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.workspace.name})"
