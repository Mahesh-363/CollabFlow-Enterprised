from django.urls import path
from .views import (
    ReminderListCreateView,
    ReminderDetailView,
    ReminderToggleView,
    ReminderSnoozeView,
)

urlpatterns = [
    path('', ReminderListCreateView.as_view(), name='reminder-list-create'),
    path('<str:id>/', ReminderDetailView.as_view(), name='reminder-detail'),
    path('<str:id>/toggle/', ReminderToggleView.as_view(), name='reminder-toggle'),
    path('<str:id>/snooze/', ReminderSnoozeView.as_view(), name='reminder-snooze'),
]
