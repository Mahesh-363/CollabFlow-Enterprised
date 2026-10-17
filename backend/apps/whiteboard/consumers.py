import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async


class WhiteboardConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time multiplayer whiteboard canvas collaboration.
    Syncs stroke paths, erase events, pointer positions, and state snapshots.
    """

    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.board_id = self.scope['url_route']['kwargs']['board_id']
        self.board_group = f"whiteboard_{self.board_id}"

        await self.channel_layer.group_add(self.board_group, self.channel_name)
        await self.accept()

        # Send current board snapshot to newly connected client
        snapshot = await self._get_board_snapshot()
        await self.send_json({
            'type': 'snapshot_load',
            'board_id': self.board_id,
            'snapshot': snapshot
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'board_group'):
            await self.channel_layer.group_discard(self.board_group, self.channel_name)

    async def receive_json(self, content):
        action = content.get('type')

        if action == 'draw_stroke':
            # Broadcast stroke drawing to peers in the board room
            await self.channel_layer.group_send(
                self.board_group,
                {
                    'type': 'broadcast_stroke',
                    'sender_id': self.user.id,
                    'stroke': content.get('stroke')
                }
            )

        elif action == 'clear_canvas':
            await self.channel_layer.group_send(
                self.board_group,
                {
                    'type': 'broadcast_clear',
                    'sender_id': self.user.id
                }
            )

        elif action == 'pointer_move':
            await self.channel_layer.group_send(
                self.board_group,
                {
                    'type': 'broadcast_pointer',
                    'user_id': self.user.id,
                    'user_name': self.user.name,
                    'x': content.get('x'),
                    'y': content.get('y')
                }
            )

        elif action == 'save_snapshot':
            snapshot_data = content.get('snapshot', {})
            await self._save_board_snapshot(snapshot_data)

    async def broadcast_stroke(self, event):
        if event['sender_id'] != self.user.id:
            await self.send_json({
                'type': 'stroke',
                'stroke': event['stroke']
            })

    async def broadcast_clear(self, event):
        await self.send_json({'type': 'clear'})

    async def broadcast_pointer(self, event):
        if event['user_id'] != self.user.id:
            await self.send_json({
                'type': 'pointer',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'x': event['x'],
                'y': event['y']
            })

    @database_sync_to_async
    def _get_board_snapshot(self):
        from apps.whiteboard.models import Whiteboard
        wb = Whiteboard.objects.filter(id=self.board_id).first()
        return wb.snapshot_data if wb else {}

    @database_sync_to_async
    def _save_board_snapshot(self, snapshot):
        from apps.whiteboard.models import Whiteboard
        Whiteboard.objects.filter(id=self.board_id).update(snapshot_data=snapshot)
