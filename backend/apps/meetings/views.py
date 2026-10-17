from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from .models import Meeting
from .serializers import MeetingSerializer, CreateUpdateMeetingSerializer


class MeetingListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateUpdateMeetingSerializer
        return MeetingSerializer

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id') or self.request.headers.get('x-workspace-id')
        queryset = Meeting.objects.all().prefetch_related('participants', 'chat_messages')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by('-scheduled_at')

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace_id') or self.request.headers.get('x-workspace-id')
        from apps.workspaces.models import Workspace
        workspace = Workspace.objects.filter(id=workspace_id).first() or self.request.user.owned_workspaces.first()
        serializer.save(workspace=workspace, host=self.request.user)


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'


class InstantMeetingView(views.APIView):
    """Instantly spins up a live meeting room and returns link."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        import uuid
        from django.utils import timezone
        from apps.workspaces.models import Workspace

        workspace_id = request.data.get('workspace_id') or request.headers.get('x-workspace-id')
        workspace = Workspace.objects.filter(id=workspace_id).first() or request.user.owned_workspaces.first()
        title = request.data.get('title', f"Instant Huddle with {request.user.name}")
        code = f"cf-{uuid.uuid4().hex[:6]}"

        meeting = Meeting.objects.create(
            workspace=workspace,
            host=request.user,
            title=title,
            scheduled_at=timezone.now(),
            duration_minutes=30,
            status='live',
            is_instant=True,
            meeting_link=f"https://meet.collabflow.io/{code}"
        )
        meeting.participants.add(request.user)

        return Response({
            'success': True,
            'meeting': MeetingSerializer(meeting).data
        }, status=status.HTTP_201_CREATED)
