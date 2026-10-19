from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification, NotificationOutbox
from .tasks import dispatch_outbox_notifications


@receiver(post_save, sender=Notification)
def handle_notification_created(sender, instance, created, **kwargs):
    if created:
        # Create Outbox record within the current transaction
        NotificationOutbox.objects.create(notification=instance)

        # Trigger async fanout only after database transaction successfully commits
        try:
            transaction.on_commit(lambda: dispatch_outbox_notifications.delay())
        except Exception:
            # Fallback for non-transactional/test environments
            pass
