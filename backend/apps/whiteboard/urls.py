from django.urls import path

from .views import WhiteboardDetailView, WhiteboardListCreateView

urlpatterns = [
    path("", WhiteboardListCreateView.as_view(), name="whiteboard-list-create"),
    path("<str:id>/", WhiteboardDetailView.as_view(), name="whiteboard-detail"),
]
