import uuid
from django.db import models
from django.utils import timezone
from apps.accounts.models import User
from apps.workspaces.models import Workspace


class Channel(models.Model):
    """
    Channel model matching TypeScript `Channel`:
    { id, workspaceId, name, description, topic, isPrivate, memberIds, unreadCount, createdById, createdAt }
    """
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"chan-{uuid.uuid4().hex[:8]}")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='channels')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    topic = models.CharField(max_length=255, blank=True, default='')
    is_private = models.BooleanField(default=False)
    members = models.ManyToManyField(User, related_name='channels', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_channels')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_channels'
        unique_together = ('workspace', 'name')
        ordering = ['name']

    def __str__(self):
        return f"#{self.name} ({self.workspace.name})"

    @property
    def workspaceId(self):
        return self.workspace_id

    @property
    def isPrivate(self):
        return self.is_private

    @property
    def createdById(self):
        return self.created_by_id or ''

    @property
    def createdAt(self):
        return self.created_at.isoformat()

    @property
    def memberIds(self):
        return list(self.members.values_list('id', flat=True))


class Conversation(models.Model):
    """
    Direct message conversation matching TypeScript `DirectMessageConversation`:
    { id, workspaceId, participantIds, unreadCount, lastMessage, lastMessageTime }
    """
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"dm-{uuid.uuid4().hex[:8]}")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='dm_conversations')
    participants = models.ManyToManyField(User, related_name='dm_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_dm_conversations'

    def __str__(self):
        return f"DM Conversation {self.id}"

    @property
    def workspaceId(self):
        return self.workspace_id

    @property
    def participantIds(self):
        return list(self.participants.values_list('id', flat=True))


class Message(models.Model):
    """
    Message model matching TypeScript `Message`:
    { id, channelId, userId, content, createdAt, updatedAt, isEdited, isDeleted, reactions, replyCount, lastReplyAt, threadParticipantIds, attachments, pinned }
    """
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"msg-{uuid.uuid4().hex[:8]}")
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, null=True, blank=True, related_name='messages')
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, null=True, blank=True, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)
    attachments = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_messages'
        ordering = ['created_at']

    def __str__(self):
        target = f"#{self.channel.name}" if self.channel else f"DM {self.conversation_id}"
        return f"[{self.created_at}] {self.user.name} in {target}: {self.content[:30]}"

    @property
    def channelId(self):
        return self.channel_id or (self.conversation_id if self.conversation_id else '')

    @property
    def userId(self):
        return self.user_id

    @property
    def isEdited(self):
        return self.is_edited

    @property
    def isDeleted(self):
        return self.is_deleted

    @property
    def createdAt(self):
        return self.created_at.isoformat()

    @property
    def replyCount(self):
        return self.thread_replies.count()

    @property
    def lastReplyAt(self):
        last_reply = self.thread_replies.order_by('-created_at').first()
        return last_reply.created_at.isoformat() if last_reply else None

    @property
    def threadParticipantIds(self):
        return list(self.thread_replies.values_list('user_id', flat=True).distinct())


class ThreadReply(models.Model):
    """
    Thread reply matching TypeScript `ThreadReply`:
    { id, messageId, userId, content, createdAt, updatedAt, isEdited, reactions }
    """
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"tr-{uuid.uuid4().hex[:8]}")
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='thread_replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='thread_replies')
    content = models.TextField()
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_thread_replies'
        ordering = ['created_at']

    @property
    def messageId(self):
        return self.message_id

    @property
    def userId(self):
        return self.user_id

    @property
    def isEdited(self):
        return self.is_edited

    @property
    def createdAt(self):
        return self.created_at.isoformat()


class Reaction(models.Model):
    """Emoji reaction attached to a message or thread reply."""
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"rx-{uuid.uuid4().hex[:8]}")
    message = models.ForeignKey(Message, on_delete=models.CASCADE, null=True, blank=True, related_name='reactions')
    thread_reply = models.ForeignKey(ThreadReply, on_delete=models.CASCADE, null=True, blank=True, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')
    emoji = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_reactions'
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.name} reacted {self.emoji}"


class ChannelReadReceipt(models.Model):
    """Tracks last read message per channel for accurate unread counts."""
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='channel_read_receipts')
    last_read_message = models.ForeignKey(Message, on_delete=models.SET_NULL, null=True, blank=True)
    last_read_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'collab_channel_read_receipts'
        unique_together = ('channel', 'user')


class ScheduledMessage(models.Model):
    """Scheduled message to be dispatched at a future timestamp."""
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"sch-{uuid.uuid4().hex[:8]}")
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, null=True, blank=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    scheduled_at = models.DateTimeField(db_index=True)
    dispatched = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_scheduled_messages'


class IdempotencyRecord(models.Model):
    """Prevents duplicate message creation on network retry."""
    key = models.CharField(max_length=128, primary_key=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_idempotency_records'
