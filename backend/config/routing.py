from django.urls import re_path
from apps.chat.consumers import ChatConsumer
from apps.meetings.consumers import MeetingSignalingConsumer
from apps.whiteboard.consumers import WhiteboardConsumer

websocket_urlpatterns = [
    re_path(r'^ws/chat/$', ChatConsumer.as_asgi()),
    re_path(r'^ws/collab/$', ChatConsumer.as_asgi()),
    re_path(r'^ws/meetings/(?P<meeting_id>[\w-]+)/$', MeetingSignalingConsumer.as_asgi()),
    re_path(r'^ws/whiteboard/(?P<board_id>[\w-]+)/$', WhiteboardConsumer.as_asgi()),
]
