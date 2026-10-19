from django.urls import path

from .views import PollListCreateView, PollVoteView

urlpatterns = [
    path("", PollListCreateView.as_view(), name="poll-list-create"),
    path("<str:poll_id>/vote/", PollVoteView.as_view(), name="poll-vote"),
]
