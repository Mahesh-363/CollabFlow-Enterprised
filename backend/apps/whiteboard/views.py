from rest_framework import generics, permissions
from .models import Whiteboard
from .serializers import WhiteboardSerializer


class WhiteboardListCreateView(generics.ListCreateAPIView):
    serializer_class = WhiteboardSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id') or self.request.headers.get('x-workspace-id')
        queryset = Whiteboard.objects.all()
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        return queryset

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace_id') or self.request.headers.get('x-workspace-id')
        from apps.workspaces.models import Workspace
        workspace = Workspace.objects.filter(id=workspace_id).first() or self.request.user.owned_workspaces.first()
        serializer.save(workspace=workspace, created_by=self.request.user)


class WhiteboardDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Whiteboard.objects.all()
    serializer_class = WhiteboardSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'
