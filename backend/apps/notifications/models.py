import uuid
from django.db import models
from apps.accounts.models import User


class Notification(models.Model):
    """
    Notification model matching TypeScript `NotificationItem`:
    { id, type, title, body, createdAt, read, linkNav, linkId, senderId }
    """
    TYPE_CHOICES = (
        ('mention', 'Mention'),
        ('dm', 'Direct Message'),
        ('task', 'Task Assignment'),
        ('meeting', 'Meeting Invitation'),
        ('reminder', 'Reminder Alert'),
        ('system', 'System Notice'),
    )

    NAV_CHOICES = (
        ('home', 'Home'),
        ('chat', 'Chat'),
        ('teams', 'Teams & Channels'),
        ('calendar', 'Calendar'),
        ('meetings', 'Meetings'),
        ('tasks', 'Tasks & Projects'),
        ('reminders', 'Reminders'),
        ('notifications', 'Activity'),
        ('files', 'Files'),
        ('people', 'People'),
        ('ai', 'AI Assistant'),
        ('settings', 'Settings'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"notif-{uuid.uuid4().hex[:8]}")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    body = models.TextField()
    read = models.BooleanField(default=False)
    link_nav = models.CharField(max_length=30, choices=NAV_CHOICES, default='notifications')
    link_id = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'collab_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] to {self.recipient.name}: {self.title}"

    @property
    def createdAt(self):
        return self.created_at.isoformat()

    @property
    def linkNav(self):
        return self.link_nav

    @property
    def linkId(self):
        return self.link_id or None

    @property
    def senderId(self):
        return self.sender_id or None


class NotificationPreference(models.Model):
    """Per-user notification delivery settings."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    email_digest = models.BooleanField(default=True)
    sound_alerts = models.BooleanField(default=True)
    muted_channels = models.JSONField(default=list, blank=True)
    dnd_enabled = models.BooleanField(default=False)

    class Meta:
        db_table = 'collab_notification_preferences'


class NotificationOutbox(models.Model):
    """
    Outbox pattern record for guaranteed asynchronous delivery.
    Written within the primary DB transaction, dispatched by Celery worker.
    """
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"out-{uuid.uuid4().hex[:8]}")
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    dispatched = models.BooleanField(default=False, db_index=True)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_notification_outbox'
