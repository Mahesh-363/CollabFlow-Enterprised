from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from apps.accounts.permissions import IsWorkspaceAdmin, IsWorkspaceOwner
from .models import Workspace, WorkspaceMembership, WorkspaceInvite
from .serializers import (
    WorkspaceSerializer,
    CreateWorkspaceSerializer,
    WorkspaceMembershipSerializer,
    WorkspaceInviteSerializer,
)


class WorkspaceListCreateView(generics.ListCreateAPIView):
    """List workspaces for authenticated user or create a new workspace."""
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateWorkspaceSerializer
        return WorkspaceSerializer

    def get_queryset(self):
        # Workspaces the user is member or owner of
        return Workspace.objects.filter(memberships__user=self.request.user).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        icon = serializer.validated_data.get('icon') or serializer.validated_data['name'][:2].upper()
        workspace = serializer.save(owner=user, icon=icon)

        # Create owner membership
        WorkspaceMembership.objects.create(
            workspace=workspace,
            user=user,
            role='owner'
        )

        # Create default channels
        from apps.chat.models import Channel
        defaults = [
            ('general', 'Company-wide announcements and work-based matters', False),
            ('announcements', 'Official organization updates and releases', False),
            ('engineering-core', 'Architecture reviews and technical RFCs', False),
        ]
        for c_name, c_desc, c_private in defaults:
            chan = Channel.objects.create(
                workspace=workspace,
                name=c_name,
                description=c_desc,
                is_private=c_private,
                created_by=user,
            )
            chan.members.add(user)


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WorkspaceSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Workspace.objects.filter(memberships__user=self.request.user).distinct()


class WorkspaceMembersView(generics.ListAPIView):
    """List all members for the specified workspace."""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WorkspaceMembershipSerializer

    def get_queryset(self):
        ws_id = self.kwargs['workspace_id']
        return WorkspaceMembership.objects.filter(workspace_id=ws_id).select_related('user')


class WorkspaceInviteView(views.APIView):
    """Create a shareable invite link with expiration."""
    permission_classes = (permissions.IsAuthenticated, IsWorkspaceAdmin)

    def post(self, request, workspace_id):
        workspace = generics.get_object_or_404(Workspace, id=workspace_id)
        role = request.data.get('role', 'member')
        expires_days = int(request.data.get('expires_days', 7))

        invite = WorkspaceInvite.objects.create(
            workspace=workspace,
            role=role,
            created_by=request.user,
            expires_at=timezone.now() + timedelta(days=expires_days)
        )
        return Response({
            'success': True,
            'code': invite.code,
            'inviteUrl': f"/invite/{invite.code}",
            'expiresAt': invite.expires_at.isoformat(),
            'role': invite.role
        })


class AcceptInviteView(views.APIView):
    """Accept an invite code to join a workspace."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, code):
        invite = generics.get_object_or_404(WorkspaceInvite, code=code)
        if not invite.is_valid():
            return Response({'success': False, 'message': 'This invitation code is expired or maximum uses reached.'}, status=400)

        membership, created = WorkspaceMembership.objects.get_or_create(
            workspace=invite.workspace,
            user=request.user,
            defaults={'role': invite.role}
        )
        invite.used_count += 1
        invite.save(update_fields=['used_count'])

        return Response({
            'success': True,
            'message': f"Joined workspace {invite.workspace.name}",
            'workspace': WorkspaceSerializer(invite.workspace).data
        })
