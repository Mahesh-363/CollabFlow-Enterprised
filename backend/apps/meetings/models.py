import uuid
from django.db import models
from apps.accounts.models import User
from apps.workspaces.models import Workspace


class Meeting(models.Model):
    """
    Meeting model matching TypeScript `Meeting`:
    { id, title, description, scheduledAt, durationMinutes, hostId, participantIds, status, meetingLink, agenda, isInstant, notes, actionItems, chatMessages }
    """
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('live', 'Live In-Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"meet-{uuid.uuid4().hex[:8]}")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='meetings')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    scheduled_at = models.DateTimeField(db_index=True)
    duration_minutes = models.IntegerField(default=30)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_meetings')
    participants = models.ManyToManyField(User, related_name='meetings', blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    meeting_link = models.CharField(max_length=255)
    agenda = models.TextField(blank=True, default='')
    is_instant = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default='')
    action_items = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_meetings'
        ordering = ['-scheduled_at']

    def __str__(self):
        return f"{self.title} ({self.status}) hosted by {self.host.name}"

    @property
    def scheduledAt(self):
        return self.scheduled_at.isoformat()

    @property
    def durationMinutes(self):
        return self.duration_minutes

    @property
    def hostId(self):
        return self.host_id

    @property
    def participantIds(self):
        return list(self.participants.values_list('id', flat=True))

    @property
    def meetingLink(self):
        return self.meeting_link

    @property
    def isInstant(self):
        return self.is_instant

    @property
    def actionItems(self):
        return self.action_items


class MeetingChatMessage(models.Model):
    """Chat message inside meeting room matching TypeScript `MeetingChatMessage`."""
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"mcm-{uuid.uuid4().hex[:8]}")
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='chat_messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_meeting_chat_messages'
        ordering = ['timestamp']

    @property
    def userId(self):
        return self.user_id

    @property
    def userName(self):
        return self.user.name
