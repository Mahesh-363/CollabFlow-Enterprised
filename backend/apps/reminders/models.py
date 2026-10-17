import uuid
from django.db import models
from apps.accounts.models import User
from apps.workspaces.models import Workspace


class Reminder(models.Model):
    """
    Reminder model matching TypeScript `Reminder`:
    { id, title, dueAt, priority, completed, snoozeUntil, linkedType, linkedId, linkedTitle, createdAt }
    """
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    LINKED_TYPE_CHOICES = (
        ('task', 'Task'),
        ('message', 'Message'),
        ('meeting', 'Meeting'),
        ('event', 'Calendar Event'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"rem-{uuid.uuid4().hex[:8]}")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='reminders')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    title = models.CharField(max_length=255)
    due_at = models.DateTimeField(db_index=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    completed = models.BooleanField(default=False, db_index=True)
    snooze_until = models.DateTimeField(null=True, blank=True)
    linked_type = models.CharField(max_length=20, choices=LINKED_TYPE_CHOICES, blank=True, null=True)
    linked_id = models.CharField(max_length=64, blank=True, null=True)
    linked_title = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_reminders'
        ordering = ['due_at']

    def __str__(self):
        return f"Reminder: {self.title} (due {self.due_at})"

    @property
    def dueAt(self):
        return self.due_at.isoformat()

    @property
    def snoozeUntil(self):
        return self.snooze_until.isoformat() if self.snooze_until else None

    @property
    def linkedType(self):
        return self.linked_type

    @property
    def linkedId(self):
        return self.linked_id

    @property
    def linkedTitle(self):
        return self.linked_title

    @property
    def createdAt(self):
        return self.created_at.isoformat()


class ReminderDeadLetterLog(models.Model):
    """Dead-letter log for reminders that failed delivery after max retries."""
    reminder = models.ForeignKey(Reminder, on_delete=models.CASCADE)
    error_message = models.TextField()
    payload = models.JSONField(default=dict)
    retry_count = models.IntegerField(default=0)
    failed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_reminder_dead_letters'
