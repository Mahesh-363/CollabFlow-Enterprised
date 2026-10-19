from django.urls import path

from .views import (
    TaskCommentListCreateView,
    TaskDetailView,
    TaskListCreateView,
    TaskReorderView,
    TaskSubtaskToggleView,
)

urlpatterns = [
    path("", TaskListCreateView.as_view(), name="task-list-create"),
    path("<str:id>/", TaskDetailView.as_view(), name="task-detail"),
    path("<str:id>/reorder/", TaskReorderView.as_view(), name="task-reorder"),
    path(
        "<str:task_id>/subtasks/<str:subtask_id>/toggle/",
        TaskSubtaskToggleView.as_view(),
        name="task-subtask-toggle",
    ),
    path("<str:task_id>/comments/", TaskCommentListCreateView.as_view(), name="task-comments"),
]
