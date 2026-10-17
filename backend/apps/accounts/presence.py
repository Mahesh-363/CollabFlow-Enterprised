"""
Presence management engine.
Tracks active WebSocket connections per user, TTL heartbeats,
and computes real-time status (online/away/offline/dnd).
"""
import time
from django.core.cache import cache
from .models import User

PRESENCE_HEARTBEAT_TTL = 60  # seconds until decay to away/offline
AWAY_INACTIVITY_THRESHOLD = 300  # 5 minutes of no activity marks away


class PresenceEngine:
    """Server-side Redis/Cache presence manager with multi-socket tracking."""

    @staticmethod
    def _socket_key(user_id: str, socket_id: str) -> str:
        return f"presence:sock:{user_id}:{socket_id}"

    @staticmethod
    def _user_key(user_id: str) -> str:
        return f"presence:user:{user_id}"

    @classmethod
    def record_heartbeat(cls, user_id: str, socket_id: str, client_ip: str = ""):
        """Register active socket heartbeat."""
        now = time.time()
        # Track individual socket with TTL
        cache.set(cls._socket_key(user_id, socket_id), now, timeout=PRESENCE_HEARTBEAT_TTL)

        # Track user summary
        user_info = cache.get(cls._user_key(user_id)) or {
            'sockets': set(),
            'last_active': now,
            'status': 'online',
            'client_ip': client_ip
        }
        if isinstance(user_info.get('sockets'), list):
            user_info['sockets'] = set(user_info['sockets'])
        user_info['sockets'].add(socket_id)
        user_info['last_active'] = now
        user_info['status'] = 'online'
        # serialize set to list for cache storage
        cache_data = {
            'sockets': list(user_info['sockets']),
            'last_active': now,
            'status': 'online',
            'client_ip': client_ip
        }
        cache.set(cls._user_key(user_id), cache_data, timeout=PRESENCE_HEARTBEAT_TTL * 3)

        # Sync DB presence if needed
        User.objects.filter(id=user_id, presence='offline').update(presence='online')

    @classmethod
    def disconnect_socket(cls, user_id: str, socket_id: str):
        """Unregister socket upon disconnect."""
        cache.delete(cls._socket_key(user_id, socket_id))
        user_info = cache.get(cls._user_key(user_id))
        if user_info and 'sockets' in user_info:
            sockets = set(user_info['sockets'])
            sockets.discard(socket_id)
            if not sockets:
                # No more active sockets
                cache_data = {
                    'sockets': [],
                    'last_active': time.time(),
                    'status': 'offline',
                }
                cache.set(cls._user_key(user_id), cache_data, timeout=300)
                User.objects.filter(id=user_id).update(presence='offline')
            else:
                user_info['sockets'] = list(sockets)
                cache.set(cls._user_key(user_id), user_info, timeout=PRESENCE_HEARTBEAT_TTL * 2)

    @classmethod
    def get_user_presence(cls, user_id: str) -> dict:
        """Return computed presence for a given user."""
        user_info = cache.get(cls._user_key(user_id))
        if not user_info or not user_info.get('sockets'):
            return {'status': 'offline', 'socket_count': 0, 'last_seen': int(time.time())}

        last_active = user_info.get('last_active', time.time())
        idle_seconds = time.time() - last_active

        computed_status = 'online'
        if idle_seconds > AWAY_INACTIVITY_THRESHOLD:
            computed_status = 'away'

        return {
            'status': computed_status,
            'socket_count': len(user_info.get('sockets', [])),
            'last_seen': int(last_active)
        }

    @classmethod
    def get_presence_map(cls) -> dict:
        """Return map of presence status for active users."""
        users = User.objects.filter(is_active=True).values('id', 'presence', 'name', 'avatar')
        result = {}
        for u in users:
            uid = u['id']
            p = cls.get_user_presence(uid)
            result[uid] = {
                'id': uid,
                'name': u['name'],
                'avatar': u['avatar'],
                'status': p['status'] if p['socket_count'] > 0 else u['presence'],
                'socketCount': p['socket_count'],
                'lastSeen': p['last_seen']
            }
        return result
