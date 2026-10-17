import uuid
from django.db import models
from apps.accounts.models import User
from apps.workspaces.models import Workspace


class CalendarEvent(models.Model):
    """
    CalendarEvent matching TypeScript `CalendarEvent`:
    { id, title, description, startDate, startTime, endDate, endTime, allDay, recurrence, location, meetingId, attendees, reminderMinutes, category, color }
    """
    RECURRENCE_CHOICES = (
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
    )

    CATEGORY_CHOICES = (
        ('meeting', 'Meeting'),
        ('deadline', 'Deadline'),
        ('review', 'Review'),
        ('focus', 'Focus Block'),
        ('personal', 'Personal'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"evt-{uuid.uuid4().hex[:8]}")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='calendar_events')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    start_date = models.DateField(db_index=True)
    start_time = models.CharField(max_length=10, default='09:00')
    end_date = models.DateField()
    end_time = models.CharField(max_length=10, default='10:00')
    all_day = models.BooleanField(default=False)
    recurrence = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, default='none')
    location = models.CharField(max_length=255, blank=True, default='')
    meeting_id = models.CharField(max_length=64, blank=True, null=True)
    attendees = models.ManyToManyField(User, through='EventAttendee', related_name='calendar_events')
    reminder_minutes = models.IntegerField(default=15)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='meeting')
    color = models.CharField(max_length=30, blank=True, default='#9333ea')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_calendar_events'
        ordering = ['start_date', 'start_time']

    def __str__(self):
        return f"{self.title} on {self.start_date} {self.start_time}"

    @property
    def startDate(self):
        return self.start_date.isoformat()

    @property
    def startTime(self):
        return self.start_time

    @property
    def endDate(self):
        return self.end_date.isoformat()

    @property
    def endTime(self):
        return self.end_time

    @property
    def allDay(self):
        return self.all_day

    @property
    def meetingId(self):
        return self.meeting_id

    @property
    def reminderMinutes(self):
        return self.reminder_minutes

    @property
    def attendeeIds(self):
        return list(self.attendees.values_list('id', flat=True))


class EventAttendee(models.Model):
    """RSVP status for event attendees."""
    RSVP_CHOICES = (
        ('accepted', 'Accepted'),
        ('tentative', 'Tentative'),
        ('declined', 'Declined'),
        ('pending', 'Pending'),
    )

    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rsvp = models.CharField(max_length=20, choices=RSVP_CHOICES, default='pending')
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'collab_event_attendees'
        unique_together = ('event', 'user')
