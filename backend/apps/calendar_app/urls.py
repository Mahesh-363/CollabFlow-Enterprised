from django.urls import path
from .views import (
    CalendarEventListCreateView,
    CalendarEventDetailView,
    CalendarConflictCheckView,
    EventRSVPView,
)

urlpatterns = [
    path('', CalendarEventListCreateView.as_view(), name='calendar-list-create'),
    path('conflicts/', CalendarConflictCheckView.as_view(), name='calendar-conflicts-check'),
    path('<str:id>/', CalendarEventDetailView.as_view(), name='calendar-detail'),
    path('<str:event_id>/rsvp/', EventRSVPView.as_view(), name='calendar-rsvp'),
]
