from django.urls import path
from .views import (
    WorkspaceListCreateView,
    WorkspaceDetailView,
    WorkspaceMembersView,
    WorkspaceInviteView,
    AcceptInviteView,
)

urlpatterns = [
    path('', WorkspaceListCreateView.as_view(), name='workspace-list-create'),
    path('<str:id>/', WorkspaceDetailView.as_view(), name='workspace-detail'),
    path('<str:workspace_id>/members/', WorkspaceMembersView.as_view(), name='workspace-members'),
    path('<str:workspace_id>/invites/', WorkspaceInviteView.as_view(), name='workspace-invite-create'),
    path('invites/<str:code>/accept/', AcceptInviteView.as_view(), name='workspace-invite-accept'),
]
