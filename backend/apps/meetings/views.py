from rest_framework import generics, permissions, status, views
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.permissions import IsWorkspaceMember

from .models import Meeting
from .serializers import CreateUpdateMeetingSerializer, MeetingSerializer


class MeetingListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateUpdateMeetingSerializer
        return MeetingSerializer

    def get_queryset(self):
        workspace_id = self.request.query_params.get("workspace_id") or self.request.headers.get(
            "x-workspace-id"
        )
        queryset = Meeting.objects.filter(
            workspace__memberships__user=self.request.user
        ).prefetch_related("participants", "chat_messages")
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by("-scheduled_at")

    def perform_create(self, serializer):
        workspace_id = self.request.data.get("workspace_id") or self.request.headers.get(
            "x-workspace-id"
        )
        from apps.workspaces.models import Workspace

        workspace = None
        if workspace_id:
            workspace = Workspace.objects.filter(
                id=workspace_id, memberships__user=self.request.user
            ).first()
        if not workspace:
            workspace = self.request.user.owned_workspaces.first()
        if not workspace:
            raise PermissionDenied("You must be a member of the workspace.")
        serializer.save(workspace=workspace, host=self.request.user)


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MeetingSerializer
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)
    lookup_field = "id"

    def get_queryset(self):
        return Meeting.objects.filter(workspace__memberships__user=self.request.user)


class InstantMeetingView(views.APIView):
    """Instantly spins up a live meeting room and returns link."""

    permission_classes = (permissions.IsAuthenticated, IsWorkspaceMember)

    def post(self, request):
        import uuid

        from django.utils import timezone

        from apps.workspaces.models import Workspace

        workspace_id = request.data.get("workspace_id") or request.headers.get("x-workspace-id")
        workspace = None
        if workspace_id:
            workspace = Workspace.objects.filter(
                id=workspace_id, memberships__user=request.user
            ).first()
        if not workspace:
            workspace = request.user.owned_workspaces.first()
        if not workspace:
            return Response(
                {"success": False, "message": "Workspace membership required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        title = request.data.get("title", f"Instant Huddle with {request.user.name}")
        code = f"cf-{uuid.uuid4().hex[:6]}"

        meeting = Meeting.objects.create(
            workspace=workspace,
            host=request.user,
            title=title,
            scheduled_at=timezone.now(),
            duration_minutes=30,
            status="live",
            is_instant=True,
            meeting_link=f"https://meet.collabflow.io/{code}",
        )
        meeting.participants.add(request.user)

        return Response(
            {"success": True, "meeting": MeetingSerializer(meeting).data},
            status=status.HTTP_201_CREATED,
        )
