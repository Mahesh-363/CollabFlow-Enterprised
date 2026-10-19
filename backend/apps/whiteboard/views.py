from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from apps.accounts.permissions import IsWorkspaceMember

from .models import Whiteboard
from .serializers import WhiteboardSerializer


class WhiteboardListCreateView(generics.ListCreateAPIView):
    serializer_class = WhiteboardSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def get_queryset(self):
        workspace_id = self.request.query_params.get("workspace_id") or self.request.headers.get(
            "x-workspace-id"
        )
        queryset = Whiteboard.objects.filter(
            Q(workspace__memberships__user=self.request.user)
            | Q(workspace__owner=self.request.user)
        ).distinct()
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        return queryset

    def perform_create(self, serializer):
        workspace_id = self.request.data.get("workspace_id") or self.request.headers.get(
            "x-workspace-id"
        )
        from apps.workspaces.models import Workspace

        workspace = None
        if workspace_id:
            workspace = Workspace.objects.filter(
                Q(id=workspace_id, memberships__user=self.request.user)
                | Q(id=workspace_id, owner=self.request.user)
            ).first()
        if not workspace:
            workspace = self.request.user.owned_workspaces.first()
        if not workspace:
            raise PermissionDenied("You must be a member of the workspace.")
        serializer.save(workspace=workspace, created_by=self.request.user)


class WhiteboardDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WhiteboardSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)
    lookup_field = "id"

    def get_queryset(self):
        return Whiteboard.objects.filter(
            Q(workspace__memberships__user=self.request.user)
            | Q(workspace__owner=self.request.user)
        ).distinct()
