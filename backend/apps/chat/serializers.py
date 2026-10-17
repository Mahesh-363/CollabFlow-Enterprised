from collections import defaultdict
from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import (
    Channel,
    Conversation,
    Message,
    ThreadReply,
    Reaction,
    ScheduledMessage,
)


def serialize_reactions_grouped(reactions_queryset):
    """
    Groups reactions into list matching TypeScript Reaction interface:
    [{ emoji: string, count: number, users: string[] }]
    """
    grouped = defaultdict(list)
    for rx in reactions_queryset:
        grouped[rx.emoji].append(rx.user_id)

    return [
        {'emoji': emoji, 'count': len(user_ids), 'users': user_ids}
        for emoji, user_ids in grouped.items()
    ]


class ChannelSerializer(serializers.ModelSerializer):
    workspaceId = serializers.CharField(source='workspace_id', read_only=True)
    isPrivate = serializers.BooleanField(source='is_private')
    memberIds = serializers.SerializerMethodField()
    unreadCount = serializers.SerializerMethodField()
    createdById = serializers.CharField(source='created_by_id', read_only=True)
    createdAt = serializers.CharField(source='createdAt', read_only=True)

    class Meta:
        model = Channel
        fields = (
            'id',
            'workspaceId',
            'name',
            'description',
            'topic',
            'isPrivate',
            'memberIds',
            'unreadCount',
            'createdById',
            'createdAt',
        )

    def get_memberIds(self, obj):
        return list(obj.members.values_list('id', flat=True))

    def get_unreadCount(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        receipt = obj.read_receipts.filter(user=request.user).first()
        if not receipt or not receipt.last_read_message:
            return obj.messages.filter(is_deleted=False).count()
        return obj.messages.filter(
            is_deleted=False,
            created_at__gt=receipt.last_read_message.created_at
        ).count()


class ConversationSerializer(serializers.ModelSerializer):
    workspaceId = serializers.CharField(source='workspace_id', read_only=True)
    participantIds = serializers.SerializerMethodField()
    unreadCount = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()
    lastMessageTime = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id',
            'workspaceId',
            'participantIds',
            'unreadCount',
            'lastMessage',
            'lastMessageTime',
        )

    def get_participantIds(self, obj):
        return list(obj.participants.values_list('id', flat=True))

    def get_unreadCount(self, obj):
        return 0

    def get_lastMessage(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        return last_msg.content if last_msg else None

    def get_lastMessageTime(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        return last_msg.created_at.isoformat() if last_msg else None


class ThreadReplySerializer(serializers.ModelSerializer):
    messageId = serializers.CharField(source='message_id', read_only=True)
    userId = serializers.CharField(source='user_id', read_only=True)
    isEdited = serializers.BooleanField(source='is_edited', read_only=True)
    createdAt = serializers.CharField(source='createdAt', read_only=True)
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = ThreadReply
        fields = (
            'id',
            'messageId',
            'userId',
            'content',
            'createdAt',
            'isEdited',
            'reactions',
        )

    def get_reactions(self, obj):
        return serialize_reactions_grouped(obj.reactions.all())


class MessageSerializer(serializers.ModelSerializer):
    channelId = serializers.SerializerMethodField()
    userId = serializers.CharField(source='user_id', read_only=True)
    isEdited = serializers.BooleanField(source='is_edited', read_only=True)
    isDeleted = serializers.BooleanField(source='is_deleted', read_only=True)
    createdAt = serializers.CharField(source='createdAt', read_only=True)
    reactions = serializers.SerializerMethodField()
    replyCount = serializers.IntegerField(read_only=True)
    lastReplyAt = serializers.CharField(read_only=True)
    threadParticipantIds = serializers.ListField(read_only=True)

    class Meta:
        model = Message
        fields = (
            'id',
            'channelId',
            'userId',
            'content',
            'createdAt',
            'isEdited',
            'isDeleted',
            'reactions',
            'replyCount',
            'lastReplyAt',
            'threadParticipantIds',
            'attachments',
            'pinned',
        )

    def get_channelId(self, obj):
        return obj.channel_id or obj.conversation_id or ''

    def get_reactions(self, obj):
        return serialize_reactions_grouped(obj.reactions.all())


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField()
    attachments = serializers.ListField(required=False, default=list)
    idempotency_key = serializers.CharField(required=False, allow_blank=True)


class ScheduledMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledMessage
        fields = ('id', 'channel', 'conversation', 'content', 'scheduled_at', 'dispatched')
        read_only_fields = ('id', 'dispatched')
