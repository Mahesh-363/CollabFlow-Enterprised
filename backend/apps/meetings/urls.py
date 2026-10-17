from django.urls import path
from .views import MeetingListCreateView, MeetingDetailView, InstantMeetingView

urlpatterns = [
    path('', MeetingListCreateView.as_view(), name='meeting-list-create'),
    path('instant/', InstantMeetingView.as_view(), name='meeting-instant'),
    path('<str:id>/', MeetingDetailView.as_view(), name='meeting-detail'),
]
