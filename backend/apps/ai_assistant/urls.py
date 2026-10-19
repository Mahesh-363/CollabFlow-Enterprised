from django.urls import path

from .views import DailyBriefView, RewriteSuggestionView, ThreadSummaryView

urlpatterns = [
    path("daily-brief/", DailyBriefView.as_view(), name="ai-daily-brief"),
    path(
        "threads/<str:message_id>/summarize/",
        ThreadSummaryView.as_view(),
        name="ai-thread-summarize",
    ),
    path("rewrite/", RewriteSuggestionView.as_view(), name="ai-rewrite"),
]
