import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("collabflow")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Celery Beat Periodic Task Schedules
app.conf.beat_schedule = {
    "process-scheduled-messages-every-minute": {
        "task": "apps.chat.tasks.process_scheduled_messages",
        "schedule": crontab(minute="*"),
    },
    "check-overdue-reminders-every-minute": {
        "task": "apps.reminders.tasks.dispatch_due_reminders",
        "schedule": crontab(minute="*"),
    },
    "cleanup-stale-presence-every-minute": {
        "task": "apps.accounts.tasks.cleanup_stale_presence_heartbeats",
        "schedule": crontab(minute="*"),
    },
    "generate-daily-briefs-every-morning": {
        "task": "apps.ai_assistant.tasks.schedule_all_daily_briefs",
        "schedule": crontab(hour=7, minute=0),
    },
}
