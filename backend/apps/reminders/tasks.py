from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.utils import timezone

from apps.notifications.models import Notification

from .models import Reminder, ReminderDeadLetterLog


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def dispatch_due_reminders(self):
    """
    Periodically checks reminders whose due_at or snooze_until has elapsed,
    creates in-app notifications, and broadcasts via channel layer.
    """
    now = timezone.now()
    due = (
        Reminder.objects.filter(completed=False, due_at__lte=now)
        .exclude(snooze_until__gt=now)
        .select_related("user", "workspace")
    )

    channel_layer = get_channel_layer()
    dispatched_count = 0

    for rem in due:
        try:
            notif = Notification.objects.create(
                recipient=rem.user,
                type="reminder",
                title=f"Reminder: {rem.title}",
                body=f"Priority: {rem.priority.upper()}",
                link_nav="reminders",
                link_id=rem.id,
            )

            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_{rem.user.id}",
                    {
                        "type": "broadcast_notification",
                        "notification": {
                            "id": notif.id,
                            "type": "reminder",
                            "title": notif.title,
                            "body": notif.body,
                            "createdAt": notif.createdAt,
                            "read": False,
                            "linkNav": "reminders",
                            "linkId": rem.id,
                        },
                    },
                )
            dispatched_count += 1
        except Exception as exc:
            if self.request.retries >= self.max_retries:
                # Dead letter logging
                ReminderDeadLetterLog.objects.create(
                    reminder=rem,
                    error_message=str(exc),
                    payload={"title": rem.title, "user_id": rem.user_id},
                    retry_count=self.request.retries,
                )
            else:
                raise self.retry(exc=exc) from exc

    return f"Dispatched {dispatched_count} due reminders"
