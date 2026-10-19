from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, views
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.permissions import IsWorkspaceMember

from .models import Task, TaskActivity, TaskComment, TaskSubtask
from .serializers import (
    CreateUpdateTaskSerializer,
    TaskCommentSerializer,
    TaskSerializer,
    TaskSubtaskSerializer,
)


class TaskListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateUpdateTaskSerializer
        return TaskSerializer

    def get_queryset(self):
        workspace_id = self.request.query_params.get("workspace_id") or self.request.headers.get(
            "x-workspace-id"
        )
        queryset = (
            Task.objects.filter(
                Q(workspace__memberships__user=self.request.user)
                | Q(workspace__owner=self.request.user)
            )
            .prefetch_related("subtasks", "comments")
            .distinct()
        )
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        # Filters
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        priority_param = self.request.query_params.get("priority")
        if priority_param:
            queryset = queryset.filter(priority=priority_param)

        assignee_param = self.request.query_params.get("assignee_id")
        if assignee_param:
            queryset = queryset.filter(assignee_id=assignee_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(title__icontains=search_param)

        return queryset.order_by("order_index", "-created_at")

    def perform_create(self, serializer):
        workspace_id = self.request.data.get("workspace_id") or self.request.headers.get(
            "x-workspace-id"
        )
        from apps.workspaces.models import Workspace, WorkspaceMembership

        workspace = (
            Workspace.objects.filter(id=workspace_id).first()
            or self.request.user.owned_workspaces.first()
        )
        if not workspace or (
            not WorkspaceMembership.objects.filter(
                workspace=workspace, user=self.request.user
            ).exists()
            and workspace.owner_id != self.request.user.id
        ):
            raise PermissionDenied("You are not a member of this workspace.")
        task = serializer.save(workspace=workspace, creator=self.request.user)

        # Create subtasks if provided in request
        subtasks_data = self.request.data.get("subtasks", [])
        for idx, sub in enumerate(subtasks_data):
            title = sub.get("title") if isinstance(sub, dict) else str(sub)
            TaskSubtask.objects.create(task=task, title=title, order=idx)

        # Record activity
        TaskActivity.objects.create(
            task=task, user=self.request.user, action="created", to_value=task.title
        )
        return task

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = self.perform_create(serializer)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)
    lookup_field = "id"

    def get_queryset(self):
        return Task.objects.filter(
            Q(workspace__memberships__user=self.request.user)
            | Q(workspace__owner=self.request.user)
        ).distinct()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CreateUpdateTaskSerializer
        return TaskSerializer

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        task = serializer.save()
        if old_status != task.status:
            TaskActivity.objects.create(
                task=task,
                user=self.request.user,
                action="status_change",
                from_value=old_status,
                to_value=task.status,
            )


class TaskReorderView(views.APIView):
    """
    Fractional indexing drag-and-drop reorder endpoint.
    Client sends { prev_order_index: float, next_order_index: float, new_status?: string }
    Calculates new midpoint order_index.
    """

    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def post(self, request, id):
        task = get_object_or_404(
            Task.objects.filter(
                Q(workspace__memberships__user=request.user) | Q(workspace__owner=request.user)
            ),
            id=id,
        )
        prev_idx = request.data.get("prev_order_index")
        next_idx = request.data.get("next_order_index")
        new_status = request.data.get("status")

        if prev_idx is not None and next_idx is not None:
            new_idx = (float(prev_idx) + float(next_idx)) / 2.0
        elif prev_idx is not None:
            new_idx = float(prev_idx) + 1000.0
        elif next_idx is not None:
            new_idx = float(next_idx) / 2.0
        else:
            new_idx = task.order_index

        task.order_index = new_idx
        if new_status and new_status != task.status:
            TaskActivity.objects.create(
                task=task,
                user=request.user,
                action="status_change",
                from_value=task.status,
                to_value=new_status,
            )
            task.status = new_status

        task.save()
        return Response({"success": True, "task": TaskSerializer(task).data})


class TaskSubtaskToggleView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def post(self, request, task_id, subtask_id):
        subtask = get_object_or_404(
            TaskSubtask.objects.filter(
                Q(task__workspace__memberships__user=request.user)
                | Q(task__workspace__owner=request.user)
            ),
            id=subtask_id,
            task_id=task_id,
        )
        subtask.completed = not subtask.completed
        subtask.save(update_fields=["completed"])
        return Response({"success": True, "subtask": TaskSubtaskSerializer(subtask).data})


class TaskCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def get_queryset(self):
        return TaskComment.objects.filter(
            Q(task__workspace__memberships__user=self.request.user)
            | Q(task__workspace__owner=self.request.user),
            task_id=self.kwargs["task_id"],
        ).select_related("user")

    def perform_create(self, serializer):
        task = get_object_or_404(
            Task.objects.filter(
                Q(workspace__memberships__user=self.request.user)
                | Q(workspace__owner=self.request.user)
            ),
            id=self.kwargs["task_id"],
        )
        serializer.save(task=task, user=self.request.user)
