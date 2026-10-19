from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response

from apps.accounts.permissions import IsWorkspaceMember

from .models import (
    Channel,
    ChannelReadReceipt,
    Conversation,
    IdempotencyRecord,
    Message,
    Reaction,
    ThreadReply,
)
from .serializers import (
    ChannelSerializer,
    MessageSerializer,
    SendMessageSerializer,
    ThreadReplySerializer,
    serialize_reactions_grouped,
)


class ChannelListCreateView(generics.ListCreateAPIView):
    serializer_class = ChannelSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def get_queryset(self):
        workspace_id = self.request.query_params.get("workspace_id") or self.request.headers.get(
            "x-workspace-id"
        )
        queryset = Channel.objects.filter(workspace__memberships__user=self.request.user)
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        # Filter out private channels the user is not a member of
        return queryset.filter(
            models_Q(is_private=False) | models_Q(members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        workspace_id = self.request.data.get("workspace_id")
        from rest_framework.exceptions import PermissionDenied

        from apps.workspaces.models import WorkspaceMembership

        if (
            workspace_id
            and not WorkspaceMembership.objects.filter(
                workspace_id=workspace_id, user=self.request.user
            ).exists()
        ):
            raise PermissionDenied("You are not a member of this workspace.")
        channel = serializer.save(workspace_id=workspace_id, created_by=self.request.user)
        channel.members.add(self.request.user)


def models_Q(*args, **kwargs):
    from django.db.models import Q

    return Q(*args, **kwargs)


class ChannelDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChannelSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)
    lookup_field = "id"

    def get_queryset(self):
        return Channel.objects.filter(workspace__memberships__user=self.request.user).distinct()


class MessageListView(generics.ListAPIView):
    """List messages for a specific channel or conversation with cursor pagination."""

    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        channel_id = self.kwargs["channel_id"]
        before_id = self.request.query_params.get("before")
        limit = min(int(self.request.query_params.get("limit", 50)), 100)

        # Check access to channel (must be member of channel's workspace) or DM (must be participant)
        channel = Channel.objects.filter(
            id=channel_id, workspace__memberships__user=self.request.user
        ).first()
        conversation = (
            Conversation.objects.filter(id=channel_id, participants=self.request.user).first()
            if not channel
            else None
        )
        if not channel and not conversation:
            from rest_framework.exceptions import NotFound, PermissionDenied

            if (
                Channel.objects.filter(id=channel_id).exists()
                or Conversation.objects.filter(id=channel_id).exists()
            ):
                raise PermissionDenied("You do not have access to this channel or conversation.")
            raise NotFound("Channel or conversation not found.")

        queryset = Message.objects.filter(
            models_Q(channel_id=channel_id) | models_Q(conversation_id=channel_id), is_deleted=False
        ).prefetch_related("reactions", "thread_replies")

        if before_id:
            pivot = Message.objects.filter(id=before_id).first()
            if pivot:
                queryset = queryset.filter(created_at__lt=pivot.created_at)

        return queryset.order_by("-created_at")[:limit][::-1]


class SendMessageView(views.APIView):
    """Send a message to a channel or DM conversation."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, channel_id):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        content = serializer.validated_data["content"]
        attachments = serializer.validated_data.get("attachments", [])
        idempotency_key = serializer.validated_data.get("idempotency_key")

        if idempotency_key:
            existing = (
                IdempotencyRecord.objects.filter(key=idempotency_key)
                .select_related("message")
                .first()
            )
            if existing:
                return Response(
                    {"success": True, "message": MessageSerializer(existing.message).data}
                )

        channel = Channel.objects.filter(
            id=channel_id, workspace__memberships__user=request.user
        ).first()
        conversation = (
            Conversation.objects.filter(id=channel_id, participants=request.user).first()
            if not channel
            else None
        )

        if not channel and not conversation:
            if (
                Channel.objects.filter(id=channel_id).exists()
                or Conversation.objects.filter(id=channel_id).exists()
            ):
                return Response(
                    {
                        "success": False,
                        "message": "You are not a member of this channel or conversation.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(
                {"success": False, "message": "Channel or conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        msg = Message.objects.create(
            channel=channel,
            conversation=conversation,
            user=request.user,
            content=content,
            attachments=attachments,
        )

        if idempotency_key:
            IdempotencyRecord.objects.create(key=idempotency_key, message=msg)

        # Broadcast via Channel layer
        channel_layer = get_channel_layer()
        msg_data = MessageSerializer(msg).data
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"channel_{channel_id}", {"type": "broadcast_message", "message": msg_data}
            )

        return Response({"success": True, "message": msg_data}, status=status.HTTP_201_CREATED)


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)
    lookup_field = "id"

    def get_queryset(self):
        return Message.objects.filter(
            models_Q(channel__workspace__memberships__user=self.request.user)
            | models_Q(conversation__participants=self.request.user)
        ).distinct()

    def perform_update(self, serializer):
        serializer.save(is_edited=True)

    def perform_destroy(self, instance):
        # Soft delete message
        instance.is_deleted = True
        instance.content = "[This message was deleted]"
        instance.save(update_fields=["is_deleted", "content"])


class ToggleReactionView(views.APIView):
    """Toggle emoji reaction on a message."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, message_id):
        msg = get_object_or_404(
            Message.objects.filter(
                models_Q(channel__workspace__memberships__user=request.user)
                | models_Q(conversation__participants=request.user)
            ),
            id=message_id,
        )
        emoji = request.data.get("emoji")
        if not emoji:
            return Response({"success": False, "message": "Emoji is required."}, status=400)

        existing = Reaction.objects.filter(message=msg, user=request.user, emoji=emoji).first()
        if existing:
            existing.delete()
        else:
            Reaction.objects.create(message=msg, user=request.user, emoji=emoji)

        reactions = serialize_reactions_grouped(msg.reactions.all())

        channel_layer = get_channel_layer()
        if channel_layer and (msg.channel_id or msg.conversation_id):
            target = msg.channel_id or msg.conversation_id
            async_to_sync(channel_layer.group_send)(
                f"channel_{target}",
                {"type": "broadcast_reaction", "message_id": msg.id, "reactions": reactions},
            )

        return Response({"success": True, "reactions": reactions})


class ThreadReplyListView(generics.ListCreateAPIView):
    """List replies or post a reply to a thread."""

    serializer_class = ThreadReplySerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def get_queryset(self):
        message_id = self.kwargs["message_id"]
        return ThreadReply.objects.filter(
            message_id=message_id, message__channel__workspace__memberships__user=self.request.user
        ).prefetch_related("reactions")

    def perform_create(self, serializer):
        message = get_object_or_404(
            Message.objects.filter(
                models_Q(channel__workspace__memberships__user=self.request.user)
                | models_Q(conversation__participants=self.request.user)
            ),
            id=self.kwargs["message_id"],
        )
        reply = serializer.save(message=message, user=self.request.user)

        # Notify via channel layer
        channel_layer = get_channel_layer()
        if channel_layer and (message.channel_id or message.conversation_id):
            target = message.channel_id or message.conversation_id
            async_to_sync(channel_layer.group_send)(
                f"channel_{target}",
                {"type": "broadcast_thread_reply", "reply": ThreadReplySerializer(reply).data},
            )


class MarkReadView(views.APIView):
    """Mark all messages up to the given message ID as read."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, channel_id):
        channel = get_object_or_404(
            Channel.objects.filter(workspace__memberships__user=request.user), id=channel_id
        )
        last_msg = channel.messages.order_by("-created_at").first()
        receipt, _ = ChannelReadReceipt.objects.get_or_create(channel=channel, user=request.user)
        receipt.last_read_message = last_msg
        receipt.save()
        return Response({"success": True, "unreadCount": 0})
