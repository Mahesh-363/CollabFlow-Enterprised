from django.urls import path
from .views import (
    ChannelListCreateView,
    ChannelDetailView,
    MessageListView,
    SendMessageView,
    MessageDetailView,
    ToggleReactionView,
    ThreadReplyListView,
    MarkReadView,
)

urlpatterns = [
    path('channels/', ChannelListCreateView.as_view(), name='channel-list-create'),
    path('channels/<str:id>/', ChannelDetailView.as_view(), name='channel-detail'),
    path('channels/<str:channel_id>/messages/', MessageListView.as_view(), name='channel-messages'),
    path('channels/<str:channel_id>/send/', SendMessageView.as_view(), name='channel-send-message'),
    path('channels/<str:channel_id>/read/', MarkReadView.as_view(), name='channel-mark-read'),
    path('messages/<str:id>/', MessageDetailView.as_view(), name='message-detail'),
    path('messages/<str:message_id>/reaction/', ToggleReactionView.as_view(), name='message-reaction-toggle'),
    path('messages/<str:message_id>/replies/', ThreadReplyListView.as_view(), name='message-thread-replies'),
]
