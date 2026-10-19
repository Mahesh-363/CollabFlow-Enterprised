from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class MeetingSignalingConsumer(AsyncJsonWebsocketConsumer):
    """
    WebRTC Signaling Consumer for video meetings:
    Relays SDP offers, answers, ICE candidates, and participant media states.
    """

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.meeting_id = self.scope["url_route"]["kwargs"]["meeting_id"]
        self.meeting_group = f"meeting_{self.meeting_id}"

        await self.channel_layer.group_add(self.meeting_group, self.channel_name)
        await self.accept()

        # Announce arrival to existing meeting participants
        await self.channel_layer.group_send(
            self.meeting_group,
            {
                "type": "peer_joined",
                "peer_id": self.user.id,
                "peer_name": self.user.name,
                "peer_avatar": self.user.avatar,
            },
        )

    async def disconnect(self, close_code):
        if hasattr(self, "meeting_group"):
            await self.channel_layer.group_send(
                self.meeting_group,
                {
                    "type": "peer_left",
                    "peer_id": self.user.id,
                    "peer_name": self.user.name,
                },
            )
            await self.channel_layer.group_discard(self.meeting_group, self.channel_name)

    async def receive_json(self, content):
        action = content.get("type")

        # WebRTC Offer / Answer / ICE Candidate
        if action in ("webrtc_offer", "webrtc_answer", "ice_candidate"):
            target_peer_id = content.get("target_peer_id")
            payload = {
                "type": f"relay_{action}",
                "from_peer_id": self.user.id,
                "target_peer_id": target_peer_id,
                "payload": content.get("payload"),
            }
            # Send to room with target filter
            await self.channel_layer.group_send(self.meeting_group, payload)

        elif action == "media_state_change":
            # Broadcast mic, camera, screen-share, or hand-raise changes
            await self.channel_layer.group_send(
                self.meeting_group,
                {
                    "type": "peer_media_state",
                    "peer_id": self.user.id,
                    "isMuted": content.get("isMuted", False),
                    "isCameraOff": content.get("isCameraOff", False),
                    "isScreenSharing": content.get("isScreenSharing", False),
                    "isHandRaised": content.get("isHandRaised", False),
                },
            )

        elif action == "meeting_chat":
            msg_content = content.get("content", "")
            if msg_content:
                msg_record = await self._save_meeting_chat(msg_content)
                await self.channel_layer.group_send(
                    self.meeting_group, {"type": "broadcast_meeting_chat", "message": msg_record}
                )

    # Event handlers
    async def peer_joined(self, event):
        await self.send_json(event)

    async def peer_left(self, event):
        await self.send_json(event)

    async def relay_webrtc_offer(self, event):
        if event.get("target_peer_id") == self.user.id:
            await self.send_json(
                {
                    "type": "webrtc_offer",
                    "from_peer_id": event["from_peer_id"],
                    "payload": event["payload"],
                }
            )

    async def relay_webrtc_answer(self, event):
        if event.get("target_peer_id") == self.user.id:
            await self.send_json(
                {
                    "type": "webrtc_answer",
                    "from_peer_id": event["from_peer_id"],
                    "payload": event["payload"],
                }
            )

    async def relay_ice_candidate(self, event):
        if event.get("target_peer_id") == self.user.id:
            await self.send_json(
                {
                    "type": "ice_candidate",
                    "from_peer_id": event["from_peer_id"],
                    "payload": event["payload"],
                }
            )

    async def peer_media_state(self, event):
        await self.send_json(event)

    async def broadcast_meeting_chat(self, event):
        await self.send_json(event)

    @database_sync_to_async
    def _save_meeting_chat(self, content):
        from apps.meetings.models import Meeting, MeetingChatMessage

        meeting = Meeting.objects.filter(id=self.meeting_id).first()
        if not meeting:
            return None
        msg = MeetingChatMessage.objects.create(meeting=meeting, user=self.user, content=content)
        return {
            "id": msg.id,
            "userId": self.user.id,
            "userName": self.user.name,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat(),
        }
