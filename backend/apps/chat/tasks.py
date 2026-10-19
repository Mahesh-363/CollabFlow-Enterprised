from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.utils import timezone

from .models import Message, ScheduledMessage
from .serializers import MessageSerializer


@shared_task
def process_scheduled_messages():
    """
    Celery task run periodically by Celery Beat:
    Dispatches all messages scheduled for or before the current timestamp.
    """
    now = timezone.now()
    due = ScheduledMessage.objects.filter(scheduled_at__lte=now, dispatched=False).select_related(
        "channel", "conversation", "user"
    )

    channel_layer = get_channel_layer()
    dispatched_count = 0

    for item in due:
        msg = Message.objects.create(
            channel=item.channel,
            conversation=item.conversation,
            user=item.user,
            content=item.content,
        )
        item.dispatched = True
        item.save(update_fields=["dispatched"])
        dispatched_count += 1

        # Broadcast via Channel layer if available
        if channel_layer:
            target_id = item.channel_id or item.conversation_id
            payload = MessageSerializer(msg).data
            async_to_sync(channel_layer.group_send)(
                f"channel_{target_id}", {"type": "broadcast_message", "message": payload}
            )

    return f"Dispatched {dispatched_count} scheduled messages"
