import uuid

from django.db import models

from apps.accounts.models import User
from apps.chat.models import Channel
from apps.workspaces.models import Workspace


def generate_task_id() -> str:
    return f"task-{uuid.uuid4().hex[:8]}"


def generate_subtask_id() -> str:
    return f"sub-{uuid.uuid4().hex[:8]}"


def generate_task_comment_id() -> str:
    return f"tc-{uuid.uuid4().hex[:8]}"


def generate_task_activity_id() -> str:
    return f"ta-{uuid.uuid4().hex[:8]}"


class Task(models.Model):
    """
    Task model matching TypeScript `Task`:
    { id, title, description, status, priority, assigneeId, creatorId, dueDate, tags, subtasks, attachments, commentsCount, channelId, createdAt }
    """

    STATUS_CHOICES = (
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("in_review", "In Review"),
        ("done", "Done"),
    )

    PRIORITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_task_id)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="tasks")
    channel = models.ForeignKey(
        Channel, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo", db_index=True)
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="medium", db_index=True
    )
    assignee = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tasks"
    )
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_tasks")
    due_date = models.DateField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    order_index = models.FloatField(
        default=1000.0, db_index=True
    )  # Fractional indexing for Kanban drag-and-drop
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "collab_tasks"
        ordering = ["order_index", "-created_at"]

    def __str__(self):
        return f"[{self.status.upper()}] {self.title} ({self.priority})"

    @property
    def assigneeId(self):
        return self.assignee_id or ""

    @property
    def creatorId(self):
        return self.creator_id

    @property
    def dueDate(self):
        return self.due_date.isoformat() if self.due_date else ""

    @property
    def channelId(self):
        return self.channel_id or None

    @property
    def commentsCount(self):
        return self.comments.count()

    @property
    def createdAt(self):
        return self.created_at.isoformat()


class TaskSubtask(models.Model):
    """Subtask item matching TypeScript `TaskSubtask`: { id, title, completed }"""

    id = models.CharField(max_length=64, primary_key=True, default=generate_subtask_id)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "collab_task_subtasks"
        ordering = ["order", "id"]


class TaskComment(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_task_comment_id)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "collab_task_comments"
        ordering = ["created_at"]


class TaskActivity(models.Model):
    """Activity history for task audit trail."""

    id = models.CharField(max_length=64, primary_key=True, default=generate_task_activity_id)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activities")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)  # e.g., 'status_change', 'assignee_change'
    from_value = models.CharField(max_length=255, blank=True)
    to_value = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "collab_task_activities"
        ordering = ["-created_at"]
