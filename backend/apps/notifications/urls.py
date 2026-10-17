from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    NotificationPreferencesView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<str:id>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('read-all/', MarkAllNotificationsReadView.as_view(), name='notification-mark-all-read'),
    path('preferences/', NotificationPreferencesView.as_view(), name='notification-preferences'),
]
