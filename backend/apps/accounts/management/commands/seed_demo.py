from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.calendar_app.models import CalendarEvent
from apps.chat.models import Channel, Message, Reaction, ThreadReply
from apps.meetings.models import Meeting
from apps.notifications.models import Notification
from apps.reminders.models import Reminder
from apps.tasks.models import Task, TaskSubtask
from apps.workspaces.models import Workspace, WorkspaceMembership


class Command(BaseCommand):
    help = "Seeds initial demo database matching frontend mock data identically."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting CollabFlow database seeding..."))

        # 1. Seed Users
        users_data = [
            (
                "user-elena",
                "elena.vance@acme.corp",
                "Elena Vance",
                "EV",
                "Staff Systems Architect",
                "owner",
                "online",
            ),
            (
                "user-alex",
                "alex.rivera@hyperflow.dev",
                "Alex Rivera",
                "AR",
                "Principal Distributed Systems Engineer",
                "admin",
                "online",
            ),
            (
                "user-marcus",
                "marcus.vance@acme.corp",
                "Marcus Vance",
                "MV",
                "Senior DevOps & SRE Lead",
                "member",
                "away",
            ),
            (
                "user-sarah",
                "sarah.jenkins@hyperflow.dev",
                "Sarah Jenkins",
                "SJ",
                "Product Design Director",
                "member",
                "offline",
            ),
            (
                "user-david",
                "david.kim@acme.corp",
                "David Kim",
                "DK",
                "Security & Cryptography Specialist",
                "member",
                "online",
            ),
            (
                "user-lisa",
                "lisa.chen@hyperflow.dev",
                "Lisa Chen",
                "LC",
                "Partner Solutions Architect",
                "guest",
                "offline",
            ),
        ]

        user_objects = {}
        for uid, email, name, avatar, title, role, presence in users_data:
            u, created = User.objects.get_or_create(
                id=uid,
                defaults={
                    "email": email,
                    "name": name,
                    "avatar": avatar,
                    "title": title,
                    "role": role,
                    "presence": presence,
                    "is_staff": role in ("owner", "admin"),
                    "is_superuser": role == "owner",
                },
            )
            u.set_password("CollabFlow#2026!")
            u.save()
            user_objects[uid] = u

        # 2. Seed Workspaces
        ws_elena, _ = Workspace.objects.get_or_create(
            id="ws-acme",
            defaults={
                "name": "Acme Platform",
                "slug": "acme-platform",
                "icon": "AP",
                "color": "#9333ea",
                "owner": user_objects["user-elena"],
            },
        )
        ws_hyper, _ = Workspace.objects.get_or_create(
            id="ws-hyperflow",
            defaults={
                "name": "HyperFlow Dev",
                "slug": "hyperflow-dev",
                "icon": "HF",
                "color": "#3b82f6",
                "owner": user_objects["user-alex"],
            },
        )

        for u in user_objects.values():
            WorkspaceMembership.objects.get_or_create(
                workspace=ws_elena, user=u, defaults={"role": u.role}
            )
            WorkspaceMembership.objects.get_or_create(
                workspace=ws_hyper, user=u, defaults={"role": u.role}
            )

        # 3. Seed Channels
        channels_data = [
            (
                "chan-general",
                "general",
                "Company-wide announcements and team updates",
                "General chatter",
                False,
            ),
            (
                "chan-eng",
                "engineering-core",
                "Architecture reviews and technical RFCs",
                "Kafka & Postgres consensus",
                False,
            ),
            (
                "chan-arch",
                "architecture",
                "High-scale distributed systems design",
                "System topology discussion",
                False,
            ),
            (
                "chan-sec",
                "security-council",
                "Private SOC-2 and cryptography compliance audit",
                "Restricted clearance",
                True,
            ),
        ]

        chan_objects = {}
        for cid, cname, cdesc, ctop, cpriv in channels_data:
            c, _ = Channel.objects.get_or_create(
                id=cid,
                workspace=ws_elena,
                defaults={
                    "name": cname,
                    "description": cdesc,
                    "topic": ctop,
                    "is_private": cpriv,
                    "created_by": user_objects["user-elena"],
                },
            )
            c.members.set(user_objects.values())
            chan_objects[cid] = c

        # 4. Seed Messages & Threads
        m1, _ = Message.objects.get_or_create(
            id="msg-1",
            channel=chan_objects["chan-eng"],
            defaults={
                "user": user_objects["user-elena"],
                "content": "RFC: Migrated our PostgreSQL instance to pgvector and deployed Celery Beat heartbeat dispatchers.",
            },
        )
        Reaction.objects.get_or_create(message=m1, user=user_objects["user-alex"], emoji="🔥")
        Reaction.objects.get_or_create(message=m1, user=user_objects["user-marcus"], emoji="🚀")

        ThreadReply.objects.get_or_create(
            id="tr-1",
            message=m1,
            defaults={
                "user": user_objects["user-alex"],
                "content": "Benchmarks show 99.4% reduction in cache contention across Daphne WebSocket connections.",
            },
        )

        # 5. Seed Tasks
        t1, _ = Task.objects.get_or_create(
            id="task-1",
            workspace=ws_elena,
            defaults={
                "creator": user_objects["user-elena"],
                "assignee": user_objects["user-alex"],
                "title": "Review Alex PR on JWT token rotation race conditions",
                "description": "Ensure token refresh blacklist atomic transactions execute under 15ms in Redis.",
                "status": "in_progress",
                "priority": "urgent",
                "due_date": "2026-10-18",
                "tags": ["Security", "OAuth", "Backend"],
                "order_index": 1000.0,
            },
        )
        TaskSubtask.objects.get_or_create(
            id="sub-1",
            task=t1,
            defaults={"title": "Verify Redis blacklist mutation", "completed": True},
        )
        TaskSubtask.objects.get_or_create(
            id="sub-2",
            task=t1,
            defaults={"title": "Stress test concurrency under Daphne", "completed": False},
        )

        # 6. Seed Meetings
        m_meet, _ = Meeting.objects.get_or_create(
            id="meet-daily",
            workspace=ws_elena,
            defaults={
                "host": user_objects["user-elena"],
                "title": "Sprint 42 Architecture & Reliability Sync",
                "description": "Cross-team sync reviewing high-throughput Channels layer reliability.",
                "scheduled_at": timezone.now() + timezone.timedelta(minutes=30),
                "duration_minutes": 45,
                "status": "scheduled",
                "meeting_link": "https://meet.collabflow.io/cf-arch-sync",
                "agenda": "1. pgvector performance\n2. WebSocket reconnect catch-up buffer\n3. Zero-downtime deployment",
            },
        )
        m_meet.participants.set(
            [user_objects["user-elena"], user_objects["user-alex"], user_objects["user-marcus"]]
        )

        # 7. Seed Calendar Events
        CalendarEvent.objects.get_or_create(
            id="evt-sync",
            workspace=ws_elena,
            creator=user_objects["user-elena"],
            defaults={
                "title": "Sprint 42 Architecture & Reliability Sync",
                "description": "Review Daphne performance",
                "start_date": timezone.now().strftime("%Y-%m-%d"),
                "start_time": "10:00",
                "end_date": timezone.now().strftime("%Y-%m-%d"),
                "end_time": "10:45",
                "category": "meeting",
                "color": "#9333ea",
                "meeting_id": m_meet.id,
            },
        )

        # 8. Seed Reminders
        Reminder.objects.get_or_create(
            id="rem-1",
            workspace=ws_elena,
            user=user_objects["user-elena"],
            defaults={
                "title": "Sprint sign-off and production release tag",
                "due_at": timezone.now() + timezone.timedelta(hours=4),
                "priority": "high",
                "completed": False,
            },
        )

        # 9. Seed Notifications
        Notification.objects.get_or_create(
            id="notif-1",
            recipient=user_objects["user-elena"],
            defaults={
                "sender": user_objects["user-alex"],
                "type": "mention",
                "title": "Alex Rivera mentioned you in #engineering-core",
                "body": "RFC review complete, ready for staging merge.",
                "link_nav": "chat",
                "link_id": "chan-eng",
                "read": False,
            },
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded CollabFlow demo database!"))
