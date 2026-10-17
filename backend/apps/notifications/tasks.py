from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import NotificationOutbox
from .serializers import NotificationSerializer


@shared_task
def dispatch_outbox_notifications():
    """
    Processes pending outbox items and fans them out through the WebSocket channel layer.
    """
    pending = NotificationOutbox.objects.filter(dispatched=False).select_related('notification', 'notification__recipient')[:100]
    channel_layer = get_channel_layer()
    dispatched_ids = []

    for item in pending:
        notif = item.notification
        recipient_id = notif.recipient_id

        if channel_layer:
            payload = NotificationSerializer(notif).data
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient_id}",
                {
                    'type': 'broadcast_notification',
                    'notification': payload
                }
            )

        item.dispatched = True
        item.attempts += 1
        item.save(update_fields=['dispatched', 'attempts'])
        dispatched_ids.append(item.id)

    return f"Fanned out {len(dispatched_ids)} notifications"
