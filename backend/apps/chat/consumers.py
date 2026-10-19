import uuid

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Production-grade WebSocket consumer for real-time messaging,
    threads, emoji reactions, typing indicators, and presence heartbeats.
    """

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.socket_id = f"sock-{uuid.uuid4().hex[:8]}"
        self.user_group = f"user_{self.user.id}"
        self.active_channels = set()

        # Join personal user group for targeted notifications and DMs
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Record presence in Redis
        await self._record_presence(is_online=True)

        await self.accept()

        # Send initial connection acknowledgment
        await self.send_json(
            {
                "type": "connection_established",
                "socket_id": self.socket_id,
                "user_id": self.user.id,
                "timestamp": timezone.now().isoformat(),
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

        # Leave all joined channel rooms
        for chan_group in getattr(self, "active_channels", []):
            await self.channel_layer.group_discard(chan_group, self.channel_name)

        if hasattr(self, "user") and self.user.is_authenticated:
            await self._record_presence(is_online=False)

    async def receive_json(self, content):
        action = content.get("type")

        if action == "join_channel":
            channel_id = content.get("channel_id")
            if channel_id:
                group_name = f"channel_{channel_id}"
                self.active_channels.add(group_name)
                await self.channel_layer.group_add(group_name, self.channel_name)
                await self.send_json({"type": "channel_joined", "channel_id": channel_id})

        elif action == "leave_channel":
            channel_id = content.get("channel_id")
            if channel_id:
                group_name = f"channel_{channel_id}"
                self.active_channels.discard(group_name)
                await self.channel_layer.group_discard(group_name, self.channel_name)

        elif action == "send_message":
            channel_id = content.get("channel_id")
            message_content = content.get("content")
            attachments = content.get("attachments", [])
            idempotency_key = content.get("idempotency_key")

            if channel_id and message_content:
                msg_data = await self._create_message(
                    channel_id, message_content, attachments, idempotency_key
                )
                if msg_data:
                    # Broadcast to channel group
                    await self.channel_layer.group_send(
                        f"channel_{channel_id}", {"type": "broadcast_message", "message": msg_data}
                    )

        elif action == "toggle_reaction":
            message_id = content.get("message_id")
            emoji = content.get("emoji")
            channel_id = content.get("channel_id")
            if message_id and emoji:
                reactions = await self._toggle_reaction(message_id, emoji)
                if channel_id:
                    await self.channel_layer.group_send(
                        f"channel_{channel_id}",
                        {
                            "type": "broadcast_reaction",
                            "message_id": message_id,
                            "reactions": reactions,
                        },
                    )

        elif action == "typing":
            channel_id = content.get("channel_id")
            is_typing = content.get("is_typing", True)
            if channel_id:
                await self.channel_layer.group_send(
                    f"channel_{channel_id}",
                    {
                        "type": "broadcast_typing",
                        "channel_id": channel_id,
                        "user_id": self.user.id,
                        "user_name": self.user.name,
                        "is_typing": is_typing,
                    },
                )

        elif action == "heartbeat":
            await self._record_presence(is_online=True)

        elif action == "catch_up":
            channel_id = content.get("channel_id")
            last_seen_id = content.get("last_seen_id")
            if channel_id and last_seen_id:
                missed_messages = await self._get_catchup_messages(channel_id, last_seen_id)
                await self.send_json(
                    {
                        "type": "catch_up_replay",
                        "channel_id": channel_id,
                        "messages": missed_messages,
                    }
                )

    # Group broadcast handlers
    async def broadcast_message(self, event):
        await self.send_json({"type": "new_message", "message": event["message"]})

    async def broadcast_reaction(self, event):
        await self.send_json(
            {
                "type": "reaction_updated",
                "message_id": event["message_id"],
                "reactions": event["reactions"],
            }
        )

    async def broadcast_typing(self, event):
        if event["user_id"] != self.user.id:
            await self.send_json(
                {
                    "type": "user_typing",
                    "channel_id": event["channel_id"],
                    "user_id": event["user_id"],
                    "user_name": event["user_name"],
                    "is_typing": event["is_typing"],
                }
            )

    async def broadcast_notification(self, event):
        await self.send_json({"type": "notification", "notification": event["notification"]})

    # Database helpers
    @database_sync_to_async
    def _create_message(self, target_id, content, attachments, idempotency_key):
        from apps.chat.models import Channel, Conversation, IdempotencyRecord, Message
        from apps.chat.serializers import MessageSerializer

        if idempotency_key:
            existing = (
                IdempotencyRecord.objects.filter(key=idempotency_key)
                .select_related("message")
                .first()
            )
            if existing:
                return MessageSerializer(existing.message).data

        channel = Channel.objects.filter(id=target_id).first()
        conversation = None if channel else Conversation.objects.filter(id=target_id).first()

        if not channel and not conversation:
            return None

        msg = Message.objects.create(
            channel=channel,
            conversation=conversation,
            user=self.user,
            content=content,
            attachments=attachments or [],
        )

        if idempotency_key:
            IdempotencyRecord.objects.create(key=idempotency_key, message=msg)

        return MessageSerializer(msg).data

    @database_sync_to_async
    def _toggle_reaction(self, message_id, emoji):
        from apps.chat.models import Message, Reaction
        from apps.chat.serializers import serialize_reactions_grouped

        msg = Message.objects.filter(id=message_id).first()
        if not msg:
            return []

        existing = Reaction.objects.filter(message=msg, user=self.user, emoji=emoji).first()
        if existing:
            existing.delete()
        else:
            Reaction.objects.create(message=msg, user=self.user, emoji=emoji)

        return serialize_reactions_grouped(msg.reactions.all())

    @database_sync_to_async
    def _get_catchup_messages(self, channel_id, last_seen_id):
        from apps.chat.models import Message
        from apps.chat.serializers import MessageSerializer

        pivot = Message.objects.filter(id=last_seen_id).first()
        if not pivot:
            msgs = Message.objects.filter(channel_id=channel_id).order_by("-created_at")[:20]
        else:
            msgs = Message.objects.filter(
                channel_id=channel_id, created_at__gt=pivot.created_at
            ).order_by("created_at")[:50]

        return MessageSerializer(msgs, many=True).data

    @database_sync_to_async
    def _record_presence(self, is_online=True):
        from apps.accounts.presence import PresenceEngine

        if is_online:
            PresenceEngine.record_heartbeat(self.user.id, self.socket_id)
        else:
            PresenceEngine.disconnect_socket(self.user.id, self.socket_id)
