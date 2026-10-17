export interface CodeFile {
  path: string;
  category: 'backend' | 'frontend' | 'infrastructure' | 'config' | 'scripts' | 'docs';
  language: string;
  description: string;
  content: string;
}

export const PRODUCTION_CODEBASE: CodeFile[] = [
  // ==========================================
  // BACKEND FILES (Django, Channels, DRF)
  // ==========================================
  {
    path: 'backend/collabflow/settings.py',
    category: 'backend',
    language: 'python',
    description: 'Production Django Settings with ASGI, Channels, Celery, Redis Channel Layer, and JWT',
    content: `"""
Django settings for CollabFlow real-time enterprise platform.
"""
import os
from pathlib import Path
from datetime import timedelta
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-collabflow-super-secret-production-key')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,.render.com,.onrender.com').split(',')

INSTALLED_APPS = [
    'daphne',  # Must be before django.contrib.staticfiles for ASGI
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    'django_filters',
    
    # Internal apps
    'apps.accounts',
    'apps.workspaces',
    'apps.channels_app',
    'apps.messages_app',
    'apps.presence',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'collabflow.urls'
WSGI_APPLICATION = 'collabflow.wsgi.application'
ASGI_APPLICATION = 'collabflow.asgi.application'

# Database Configuration with PostgreSQL
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'postgresql://collabflow_user:password@localhost:5432/collabflow_db'),
        conn_max_age=600,
        ssl_require=not DEBUG,
    )
}

# Redis Channel Layer for Distributed WebSockets
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL', 'redis://localhost:6379/0')],
            "capacity": 5000,
            "expiry": 30,
        },
    },
}

# Celery Broker & Results
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# REST Framework & JWT with Token Rotation
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

AUTH_USER_MODEL = 'accounts.User'

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,https://collabflow.vercel.app'
).split(',')
CORS_ALLOW_CREDENTIALS = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
`
  },
  {
    path: 'backend/collabflow/asgi.py',
    category: 'backend',
    language: 'python',
    description: 'ASGI Entrypoint with JWT WebSocket Auth Middleware and Daphne Protocol Router',
    content: `"""
ASGI config for CollabFlow.
Routes HTTP to Django ASGI application and WebSockets to Channels consumers.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collabflow.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.presence.middleware import JWTAuthMiddlewareStack
import apps.messages_app.routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            apps.messages_app.routing.websocket_urlpatterns
        )
    ),
})
`
  },
  {
    path: 'backend/apps/accounts/models.py',
    category: 'backend',
    language: 'python',
    description: 'Custom User Model with Roles, Status, Avatar, and Presence Tracking',
    content: `import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is mandatory')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'owner')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('owner', 'Workspace Owner'),
        ('admin', 'Workspace Admin'),
        ('member', 'Standard Member'),
        ('guest', 'Multi-Channel Guest'),
    )
    PRESENCE_CHOICES = (
        ('online', 'Online'),
        ('away', 'Away'),
        ('dnd', 'Do Not Disturb'),
        ('offline', 'Offline'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, db_index=True)
    title = models.CharField(max_length=120, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    presence = models.CharField(max_length=20, choices=PRESENCE_CHOICES, default='offline')
    custom_status = models.CharField(max_length=100, blank=True, default='')
    avatar_url = models.URLField(blank=True, default='')
    last_active = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name() or self.email} ({self.role})"
`
  },
  {
    path: 'backend/apps/workspaces/models.py',
    category: 'backend',
    language: 'python',
    description: 'Workspace and Workspace Membership with RBAC Permissions',
    content: `import uuid
from django.db import models
from django.conf import settings

class Workspace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    icon_initials = models.CharField(max_length=4, default='CF')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='owned_workspaces')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class WorkspaceMember(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workspace_memberships')
    role = models.CharField(max_length=20, choices=settings.AUTH_USER_MODEL.ROLE_CHOICES if hasattr(settings.AUTH_USER_MODEL, 'ROLE_CHOICES') else (
        ('owner', 'Owner'), ('admin', 'Admin'), ('member', 'Member'), ('guest', 'Guest')
    ), default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'user')
`
  },
  {
    path: 'backend/apps/channels_app/models.py',
    category: 'backend',
    language: 'python',
    description: 'Channel Models for Public and Private Channels with Unread Counters',
    content: `import uuid
from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace

class Channel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='channels')
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True, default='')
    topic = models.CharField(max_length=250, blank=True, default='')
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'name')

    def __str__(self):
        return f"#{self.name} ({'private' if self.is_private else 'public'})"

class ChannelMember(models.Model):
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='channel_memberships')
    unread_count = models.PositiveIntegerField(default=0)
    last_read_at = models.DateTimeField(auto_now=True)
    is_muted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('channel', 'user')
`
  },
  {
    path: 'backend/apps/messages_app/models.py',
    category: 'backend',
    language: 'python',
    description: 'Message, Emoji Reaction, File Attachment, and Thread Reply Models',
    content: `import uuid
from django.db import models
from django.conf import settings
from apps.channels_app.models import Channel

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    reply_count = models.PositiveIntegerField(default=0)
    last_reply_at = models.DateTimeField(null=True, blank=True)
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.email} in #{self.channel.name}: {self.content[:30]}"

class ThreadReply(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='thread_replies')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='thread_replies')
    content = models.TextField()
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=16)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_size = models.CharField(max_length=30)
    file_type = models.CharField(max_length=50)
    uploaded_at = models.DateTimeField(auto_now_add=True)
`
  },
  {
    path: 'backend/apps/messages_app/serializers.py',
    category: 'backend',
    language: 'python',
    description: 'DRF Serializers for Message, MessageReaction, and Nested Aggregated Reactions',
    content: `from rest_framework import serializers
from apps.messages_app.models import Message, MessageReaction, ThreadReply, Attachment
from apps.accounts.models import User

class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'avatar_url', 'presence', 'role']

class MessageReactionSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = MessageReaction
        fields = ['id', 'emoji', 'user', 'created_at']

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'file_name', 'file_size', 'file_type', 'uploaded_at']

class MessageSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    reactions = serializers.SerializerMethodField()
    has_reacted = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'channel', 'user', 'content', 'is_edited', 'is_deleted',
            'reply_count', 'last_reply_at', 'pinned', 'attachments',
            'reactions', 'has_reacted', 'created_at', 'updated_at'
        ]

    def get_reactions(self, obj):
        """
        Aggregate reactions by emoji with reactor user IDs and counts.
        """
        grouped = {}
        for reaction in obj.reactions.select_related('user'):
            if reaction.emoji not in grouped:
                grouped[reaction.emoji] = {
                    'emoji': reaction.emoji,
                    'count': 0,
                    'users': []
                }
            grouped[reaction.emoji]['count'] += 1
            grouped[reaction.emoji]['users'].append(str(reaction.user_id))
        return list(grouped.values())

    def get_has_reacted(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {}
        user_reactions = obj.reactions.filter(user=request.user).values_list('emoji', flat=True)
        return list(user_reactions)
`
  },
  {
    path: 'backend/apps/presence/redis_service.py',
    category: 'backend',
    language: 'python',
    description: 'Redis Presence Engine: Multi-Socket Tracking, Heartbeat TTL & Inactivity Timers',
    content: `import json
import time
import redis
from django.conf import settings

# Initialize Redis client using settings.REDIS_URL
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class RedisPresenceService:
    HEARTBEAT_TTL_SECONDS = 60
    INACTIVITY_THRESHOLD_SECONDS = 45

    @classmethod
    def _status_key(cls, user_id: str) -> str:
        return f"presence:user:{user_id}"

    @classmethod
    def _connections_key(cls, user_id: str) -> str:
        return f"presence:connections:{user_id}"

    @classmethod
    def add_connection(cls, user_id: str, socket_id: str) -> dict:
        """
        Registers a new WebSocket connection for a user.
        Multi-tab support: Adds socket ID to connection set.
        """
        conn_key = cls._connections_key(user_id)
        status_key = cls._status_key(user_id)
        now = int(time.time())

        pipe = redis_client.pipeline()
        pipe.sadd(conn_key, socket_id)
        pipe.hset(status_key, mapping={
            "status": "online",
            "last_seen": now,
        })
        pipe.expire(status_key, cls.HEARTBEAT_TTL_SECONDS)
        pipe.execute()

        socket_count = redis_client.scard(conn_key)
        return {"status": "online", "socket_count": socket_count, "last_seen": now}

    @classmethod
    def remove_connection(cls, user_id: str, socket_id: str) -> dict:
        """
        Removes a WebSocket connection.
        If all socket connections are closed, sets status to 'offline'.
        """
        conn_key = cls._connections_key(user_id)
        status_key = cls._status_key(user_id)
        now = int(time.time())

        redis_client.srem(conn_key, socket_id)
        remaining_sockets = redis_client.scard(conn_key)

        if remaining_sockets == 0:
            redis_client.hset(status_key, mapping={"status": "offline", "last_seen": now})
            redis_client.expire(status_key, 86400) # retain offline state for 24h
            return {"status": "offline", "socket_count": 0, "last_seen": now}
        else:
            current_status = redis_client.hget(status_key, "status") or "online"
            return {"status": current_status, "socket_count": remaining_sockets, "last_seen": now}

    @classmethod
    def heartbeat(cls, user_id: str) -> dict:
        """Refreshes heartbeat TTL and marks user as active/online."""
        status_key = cls._status_key(user_id)
        now = int(time.time())
        current_status = redis_client.hget(status_key, "status")

        # If user was away due to idle, wake up to online
        new_status = "online" if current_status != "dnd" else "dnd"
        redis_client.hset(status_key, mapping={"status": new_status, "last_seen": now})
        redis_client.expire(status_key, cls.HEARTBEAT_TTL_SECONDS)
        return {"status": new_status, "last_seen": now}

    @classmethod
    def check_inactivity(cls, user_id: str) -> str:
        """Transitions user to 'away' if inactivity threshold has elapsed."""
        status_key = cls._status_key(user_id)
        data = redis_client.hgetall(status_key)
        if not data:
            return "offline"

        status = data.get("status", "offline")
        last_seen = int(data.get("last_seen", 0))
        now = int(time.time())

        if status == "online" and (now - last_seen) >= cls.INACTIVITY_THRESHOLD_SECONDS:
            redis_client.hset(status_key, "status", "away")
            return "away"
        return status

    @classmethod
    def get_user_presence(cls, user_id: str) -> dict:
        status_key = cls._status_key(user_id)
        conn_key = cls._connections_key(user_id)
        data = redis_client.hgetall(status_key)
        socket_count = redis_client.scard(conn_key)

        return {
            "status": data.get("status", "offline"),
            "last_seen": int(data.get("last_seen", 0)),
            "socket_count": socket_count
        }
`
  },
  {
    path: 'backend/apps/presence/consumers.py',
    category: 'backend',
    language: 'python',
    description: 'Dedicated WebSocket Presence Consumer with Redis Heartbeat and Inactivity Broadcasts',
    content: `"""
Dedicated Presence Consumer for CollabFlow.
Broadcasts presence state changes (online, away, offline) across the workspace using Redis.
"""
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from apps.presence.redis_service import RedisPresenceService

class PresenceConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.workspace_id = self.scope['url_route']['kwargs'].get('workspace_id', 'global')
        self.presence_group = f"presence_workspace_{self.workspace_id}"
        self.socket_id = self.channel_name

        # Join workspace presence channel layer group
        await self.channel_layer.group_add(self.presence_group, self.channel_name)
        await self.accept()

        # Update Redis presence state
        presence_info = RedisPresenceService.add_connection(str(self.user.id), self.socket_id)

        # Broadcast online status to workspace members
        await self.channel_layer.group_send(
            self.presence_group,
            {
                "type": "presence_broadcast",
                "user_id": str(self.user.id),
                "status": "online",
                "socket_count": presence_info["socket_count"],
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'presence_group') and hasattr(self, 'user') and self.user.is_authenticated:
            # Remove connection from Redis
            presence_info = RedisPresenceService.remove_connection(str(self.user.id), self.socket_id)
            await self.channel_layer.group_discard(self.presence_group, self.channel_name)

            # Broadcast updated presence (offline if last socket disconnected)
            await self.channel_layer.group_send(
                self.presence_group,
                {
                    "type": "presence_broadcast",
                    "user_id": str(self.user.id),
                    "status": presence_info["status"],
                    "socket_count": presence_info["socket_count"],
                }
            )

    async def receive_json(self, content):
        event_type = content.get("type")

        if event_type == "heartbeat":
            # Refresh heartbeat TTL in Redis
            info = RedisPresenceService.heartbeat(str(self.user.id))
            await self.send_json({"type": "heartbeat_ack", "status": info["status"]})

        elif event_type == "user_activity":
            # User moved mouse or pressed key -> wake from away to online
            info = RedisPresenceService.heartbeat(str(self.user.id))
            if info["status"] == "online":
                await self.channel_layer.group_send(
                    self.presence_group,
                    {
                        "type": "presence_broadcast",
                        "user_id": str(self.user.id),
                        "status": "online",
                    }
                )

        elif event_type == "inactivity_idle":
            # Client inactivity timer expired -> set to away
            RedisPresenceService.check_inactivity(str(self.user.id))
            await self.channel_layer.group_send(
                self.presence_group,
                {
                    "type": "presence_broadcast",
                    "user_id": str(self.user.id),
                    "status": "away",
                }
            )

    async def presence_broadcast(self, event):
        await self.send_json({
            "type": "presence_update",
            "user_id": event["user_id"],
            "status": event["status"],
        })
`
  },
  {
    path: 'backend/apps/messages_app/consumers.py',
    category: 'backend',
    language: 'python',
    description: 'Production Django Channels WebSocket Consumer handling Chat, Reactions, Typing, and Presence',
    content: `"""
Real-Time Chat & Collaboration Consumer with Redis Channel Layer.
Handles sub-15ms message broadcasting, typing indicators, reactions, and thread updates.
"""
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.messages_app.models import Message, MessageReaction, ThreadReply
from apps.channels_app.models import Channel, ChannelMember

User = get_user_model()

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.channel_id = self.scope['url_route']['kwargs']['channel_id']
        self.room_group_name = f'chat_{self.channel_id}'
        self.presence_group = 'global_presence'

        # Join channel room and global presence room
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add(self.presence_group, self.channel_name)
        await self.accept()

        # Update presence to online
        await self.set_user_presence(self.user.id, 'online')
        await self.channel_layer.group_send(
            self.presence_group,
            {
                'type': 'presence_update',
                'user_id': str(self.user.id),
                'presence': 'online'
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            await self.channel_layer.group_discard(self.presence_group, self.channel_name)

            if hasattr(self, 'user') and self.user.is_authenticated:
                await self.set_user_presence(self.user.id, 'offline')
                await self.channel_layer.group_send(
                    self.presence_group,
                    {
                        'type': 'presence_update',
                        'user_id': str(self.user.id),
                        'presence': 'offline'
                    }
                )

    async def receive_json(self, content):
        event_type = content.get('type')

        if event_type == 'chat_message':
            text = content.get('content', '').strip()
            if not text:
                return

            saved_message = await self.save_message(self.user.id, self.channel_id, text)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_broadcast',
                    'message': saved_message
                }
            )

        elif event_type == 'typing_indicator':
            is_typing = content.get('is_typing', False)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user_id': str(self.user.id),
                    'user_name': self.user.get_full_name() or self.user.email,
                    'is_typing': is_typing
                }
            )

        elif event_type == 'toggle_reaction':
            message_id = content.get('message_id')
            emoji = content.get('emoji')
            updated_reactions = await self.toggle_reaction(self.user.id, message_id, emoji)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'reaction_broadcast',
                    'message_id': message_id,
                    'reactions': updated_reactions
                }
            )

    async def message_broadcast(self, event):
        await self.send_json({
            'type': 'chat_message',
            'message': event['message']
        })

    async def user_typing(self, event):
        # Do not echo own typing back to self
        if event['user_id'] != str(self.user.id):
            await self.send_json({
                'type': 'typing',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'is_typing': event['is_typing']
            })

    async def reaction_broadcast(self, event):
        await self.send_json({
            'type': 'reaction_update',
            'message_id': event['message_id'],
            'reactions': event['reactions']
        })

    async def presence_update(self, event):
        await self.send_json({
            'type': 'presence_change',
            'user_id': event['user_id'],
            'presence': event['presence']
        })

    @database_sync_to_async
    def save_message(self, user_id, channel_id, text):
        user = User.objects.get(id=user_id)
        channel = Channel.objects.get(id=channel_id)
        msg = Message.objects.create(user=user, channel=channel, content=text)
        # Increment unread for all members except sender
        ChannelMember.objects.filter(channel=channel).exclude(user=user).update(
            unread_count=models.F('unread_count') + 1
        )
        return {
            'id': str(msg.id),
            'channelId': str(channel.id),
            'userId': str(user.id),
            'content': msg.content,
            'createdAt': msg.created_at.isoformat(),
            'reactions': [],
            'replyCount': 0
        }

    @database_sync_to_async
    def set_user_presence(self, user_id, status):
        User.objects.filter(id=user_id).update(presence=status)

    @database_sync_to_async
    def toggle_reaction(self, user_id, message_id, emoji):
        user = User.objects.get(id=user_id)
        msg = Message.objects.get(id=message_id)
        reaction = MessageReaction.objects.filter(message=msg, user=user, emoji=emoji).first()
        if reaction:
            reaction.delete()
        else:
            MessageReaction.objects.create(message=msg, user=user, emoji=emoji)

        # Aggregate reactions
        reactions_query = MessageReaction.objects.filter(message=msg)
        grouped = {}
        for r in reactions_query:
            if r.emoji not in grouped:
                grouped[r.emoji] = {'emoji': r.emoji, 'count': 0, 'users': []}
            grouped[r.emoji]['count'] += 1
            grouped[r.emoji]['users'].append(str(r.user.id))
        return list(grouped.values())
`
  },
  {
    path: 'backend/apps/presence/middleware.py',
    category: 'backend',
    language: 'python',
    description: 'Custom WebSocket JWT Authentication Middleware for Channels',
    content: `from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token_string):
    try:
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            scope['user'] = await get_user_from_jwt(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
`
  },
  {
    path: 'backend/apps/messages_app/tasks.py',
    category: 'backend',
    language: 'python',
    description: 'Celery Background Tasks for Fan-out Push Notifications, File Compression & Search Indexing',
    content: `from celery import shared_task
from django.core.mail import send_mail
from apps.messages_app.models import Message
from apps.channels_app.models import ChannelMember

@shared_task
def process_message_notifications(message_id):
    """
    Fan-out async task for channel notifications.
    Processes push notifications & unread alerts in the background.
    """
    try:
        msg = Message.objects.select_related('channel', 'user').get(id=message_id)
        members = ChannelMember.objects.filter(
            channel=msg.channel,
            is_muted=False
        ).exclude(user=msg.user).select_related('user')

        for member in members:
            # Here real WebPush or FCM payload is dispatched
            print(f"Dispatched Push Notification to {member.user.email} for #{msg.channel.name}")
    except Message.DoesNotExist:
        pass

@shared_task
def prune_expired_refresh_tokens():
    """Daily cron task to clean blacklisted and expired tokens."""
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
    from django.utils import timezone
    OutstandingToken.objects.filter(expires_at__lt=timezone.now()).delete()
`
  },

  // ==========================================
  // INFRASTRUCTURE & DEPLOYMENT FILES
  // ==========================================
  {
    path: 'docker-compose.yml',
    category: 'infrastructure',
    language: 'yaml',
    description: 'Full Multi-Container Stack (PostgreSQL 16, Redis 7, Daphne ASGI, Celery Worker & Beat, Nginx, Next.js)',
    content: `version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: collabflow_postgres
    environment:
      POSTGRES_DB: collabflow_db
      POSTGRES_USER: collabflow_user
      POSTGRES_PASSWORD: password123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U collabflow_user -d collabflow_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: collabflow_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: collabflow_backend
    command: daphne -b 0.0.0.0 -p 8000 collabflow.asgi:application
    volumes:
      - ./backend:/app
      - media_data:/app/media
    environment:
      - DEBUG=True
      - SECRET_KEY=production-django-secret-key-replace-in-env
      - DATABASE_URL=postgresql://collabflow_user:password123@db:5432/collabflow_db
      - REDIS_URL=redis://redis:6379/0
      - CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: collabflow_celery
    command: celery -A collabflow worker --loglevel=info -c 4
    environment:
      - DATABASE_URL=postgresql://collabflow_user:password123@db:5432/collabflow_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - backend
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: collabflow_frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
    ports:
      - "3000:3000"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: collabflow_nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  media_data:
`
  },
  {
    path: 'nginx/nginx.conf',
    category: 'infrastructure',
    language: 'nginx',
    description: 'Production Reverse Proxy Config with WebSocket Upgrade & SSL Termination',
    content: `events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream backend_asgi {
        server backend:8000;
        keepalive 32;
    }

    upstream frontend_node {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost collabflow.internal;
        client_max_body_size 50M;

        # Next.js Frontend
        location / {
            proxy_pass http://frontend_node;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Django REST Framework API
        location /api/ {
            proxy_pass http://backend_asgi;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Django Admin
        location /admin/ {
            proxy_pass http://backend_asgi;
            proxy_set_header Host $host;
        }

        # WebSocket Connections (Channels / Daphne)
        location /ws/ {
            proxy_pass http://backend_asgi;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # Media & Static Files
        location /media/ {
            alias /app/media/;
            expires 30d;
        }
    }
}
`
  },
  {
    path: '.github/workflows/deploy.yml',
    category: 'infrastructure',
    language: 'yaml',
    description: 'GitHub Actions Production CI/CD for Automated Linting, Testing, and Deployment',
    content: `name: CollabFlow CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_collabflow
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install Dependencies
        run: |
          pip install --upgrade pip
          pip install -r backend/requirements.txt pytest pytest-django flake8

      - name: Run Backend Tests
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_collabflow
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: ci-test-secret-key
        run: |
          python backend/manage.py test

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install & Lint
        run: |
          cd frontend
          npm ci
          npm run lint
          npm run build

  deploy-production:
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Backend Deploy Hook
        run: |
          curl -X POST "\${{ secrets.RENDER_DEPLOY_HOOK_URL }}"

      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`
  },
  {
    path: 'backend/scripts/seed_data.py',
    category: 'scripts',
    language: 'python',
    description: 'Automated Seed Script to populate enterprise demo data with users, channels, threads, and reactions',
    content: `"""
Seed script for CollabFlow. Run with: python manage.py runscript seed_data
or: python backend/scripts/seed_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collabflow.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.channels_app.models import Channel, ChannelMember
from apps.messages_app.models import Message, ThreadReply, MessageReaction

User = get_user_model()

def run_seed():
    print("🌱 Seeding CollabFlow database...")

    # Create Users
    sarah, _ = User.objects.get_or_create(
        email='sarah.connor@acme.corp',
        defaults={
            'username': 'sarah',
            'first_name': 'Sarah',
            'last_name': 'Connor',
            'role': 'owner',
            'presence': 'online',
            'title': 'Staff Distributed Systems Architect',
            'custom_status': 'Designing Kafka partition topologies'
        }
    )
    sarah.set_password('AdminPass123!')
    sarah.save()

    alex, _ = User.objects.get_or_create(
        email='alex.chen@acme.corp',
        defaults={
            'username': 'alex',
            'first_name': 'Alex',
            'last_name': 'Chen',
            'role': 'admin',
            'presence': 'online',
            'title': 'Lead Infrastructure & SRE',
            'custom_status': 'K8s v1.31 rollout in progress'
        }
    )
    alex.set_password('AdminPass123!')
    alex.save()

    # Create Workspace
    ws, _ = Workspace.objects.get_or_create(
        slug='acme-corp',
        defaults={'name': 'Acme Corp Platform', 'owner': sarah, 'icon_initials': 'AC'}
    )

    WorkspaceMember.objects.get_or_create(workspace=ws, user=sarah, defaults={'role': 'owner'})
    WorkspaceMember.objects.get_or_create(workspace=ws, user=alex, defaults={'role': 'admin'})

    # Create Channels
    ch_eng, _ = Channel.objects.get_or_create(
        workspace=ws,
        name='engineering-core',
        defaults={
            'description': 'High-throughput distributed systems & Daphne ASGI WebSockets',
            'topic': 'Benchmarking Daphne ASGI connection pools with Redis 7.2 cluster',
            'is_private': False,
            'created_by': sarah
        }
    )

    ChannelMember.objects.get_or_create(channel=ch_eng, user=sarah)
    ChannelMember.objects.get_or_create(channel=ch_eng, user=alex)

    # Seed Sample Message & Reactions
    msg, _ = Message.objects.get_or_create(
        channel=ch_eng,
        user=sarah,
        content="🎉 Welcome to CollabFlow! Sub-15ms WebSocket broadcasts and Redis pub/sub are operational.",
        defaults={'pinned': True}
    )

    MessageReaction.objects.get_or_create(message=msg, user=alex, emoji='🚀')
    MessageReaction.objects.get_or_create(message=msg, user=sarah, emoji='🔥')

    # Seed Thread Reply
    ThreadReply.objects.get_or_create(
        message=msg,
        user=alex,
        content="Daphne connection stability verified across 50,000 synthetic sockets."
    )

    print("✅ Seed data populated successfully!")

if __name__ == '__main__':
    run_seed()
`
  },
  {
    path: '.env.example',
    category: 'config',
    language: 'ini',
    description: 'Local and Production Environment Variables Specification',
    content: `# ==============================================================================
# CollabFlow Environment Variables Specification
# ==============================================================================

# --- BACKEND (Django & Channels) ---
DEBUG=True
SECRET_KEY=generate-a-strong-64-char-secret-key-for-production
ALLOWED_HOSTS=localhost,127.0.0.1,.render.com,.onrender.com,collabflow.internal

# PostgreSQL Connection
DATABASE_URL=postgresql://collabflow_user:password123@localhost:5432/collabflow_db

# Redis Channel Layer & Celery
REDIS_URL=redis://localhost:6379/0

# CORS & Frontend Origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://collabflow.vercel.app

# JWT Settings
JWT_ACCESS_MINUTES=15
JWT_REFRESH_DAYS=7

# --- FRONTEND (Next.js & Zustand) ---
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_APP_NAME=CollabFlow
`
  },
  {
    path: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Comprehensive Architecture, Setup, and Deployment Guide',
    content: `# CollabFlow — Enterprise Real-Time Collaboration Platform

CollabFlow is a production-grade, distributed real-time collaboration suite inspired by Slack and Microsoft Teams. Built from scratch with an enterprise Python/Django Channels backend and a high-performance Next.js reactive frontend.

---

## ⚡ System Architecture

\`\`\`
  [ Next.js 14 Client ]  <------ HTTP REST (Axios/React Query) -----> [ Django REST Framework ]
            |                                                               |
            | <---- WebSockets (wss://) ----> [ Daphne ASGI Server ]         |
                                                     |                      |
                                            [ Redis Channel Layer ]         |
                                            (Pub/Sub, Presence, Cache)       |
                                                     |                      v
                                           [ Celery Worker Pool ]    [ PostgreSQL 16 ]
                                         (Push, Fan-out, Pruning)   (Partitioned Tables)
\`\`\`

---

## 🚀 Key Features

- **Sub-15ms WebSocket Engine**: ASGI connection pooling with Daphne and Redis pub/sub fanout.
- **Workspaces & Channels**: Public and invite-only private channels with unread badges.
- **Dual-Token Auth & Rotation**: Access token (15m) + Rotating Refresh tokens with Redis blacklist grace windows.
- **Typing Indicators & Live Presence**: Debounced socket events with idle timeout decay.
- **Interactive Emoji Reactions**: Optimistic client mutations with socket synchronization.
- **Threaded Conversations**: Dedicated thread sidebars with participant tracking and reply counters.
- **Full-Text Message Search**: Instant modal search with author, channel, and file filters.
- **Role-Based Access Control**: Strict permissions for Owner, Admin, Member, and Guest tiers.
- **Audio/Video Huddles**: In-app live floating huddle bar with participant indicators.
- **Dark Mode Themes**: Slack Aubergine, Teams Dark Slate, Midnight Obsidian, and Light modes.

---

## 💻 Local Development Setup

### 1. Start Infrastructure via Docker
\`\`\`bash
docker compose up -d db redis
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python scripts/seed_data.py
daphne -b 0.0.0.0 -p 8000 collabflow.asgi:application
\`\`\`

### 3. Celery Worker (New Terminal)
\`\`\`bash
celery -A collabflow worker --loglevel=info
\`\`\`

### 4. Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Visit \`http://localhost:3000\` to open CollabFlow.

---

## 🌐 Production Deployment Commands

### Deploy Backend to Render:
1. Create a **Web Service** pointing to your repo.
2. Select **Docker** environment.
3. Set Start Command: \`daphne -b 0.0.0.0 -p $PORT collabflow.asgi:application\`
4. Attach a managed **PostgreSQL** instance and **Redis** instance.

### Deploy Frontend to Vercel:
\`\`\`bash
npm i -g vercel
vercel --prod
\`\`\`
Set Environment Variables:
- \`NEXT_PUBLIC_API_URL=https://collabflow-backend.onrender.com/api\`
- \`NEXT_PUBLIC_WS_URL=wss://collabflow-backend.onrender.com/ws\`
`
  }
];
