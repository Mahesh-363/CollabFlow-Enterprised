"""
Role-Based Access Control (RBAC) permissions for CollabFlow.
Roles: owner > admin > member > guest
"""

from rest_framework import permissions


class IsWorkspaceOwner(permissions.BasePermission):
    """Allows access only to workspace owners."""

    message = "Only the workspace owner can perform this operation."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, "workspace", obj)
        return hasattr(workspace, "owner_id") and workspace.owner_id == request.user.id


class IsWorkspaceAdmin(permissions.BasePermission):
    """Allows access to workspace owners and admins."""

    message = "You must be an administrator or owner of this workspace."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ("owner", "admin") or request.user.is_superuser


class IsWorkspaceMember(permissions.BasePermission):
    """Allows access to workspace members, admins, and owners (excluding guests for sensitive ops)."""

    message = "You are not a member of this workspace."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role not in ("owner", "admin", "member"):
            return False

        workspace_id = (
            getattr(view, "kwargs", {}).get("workspace_id")
            or request.query_params.get("workspace_id")
            or request.headers.get("x-workspace-id")
        )
        if not workspace_id and hasattr(request, "data") and isinstance(request.data, dict):
            workspace_id = (
                request.data.get("workspace_id")
                or request.data.get("workspace")
                or request.data.get("workspaceId")
            )

        if workspace_id:
            from apps.workspaces.models import Workspace, WorkspaceMembership

            return (
                WorkspaceMembership.objects.filter(
                    workspace_id=workspace_id, user=request.user
                ).exists()
                or Workspace.objects.filter(id=workspace_id, owner=request.user).exists()
            )
        return True

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        workspace = getattr(obj, "workspace", None)
        workspace_id = None
        if workspace is not None:
            workspace_id = getattr(workspace, "id", None)
        elif hasattr(obj, "workspace_id"):
            workspace_id = obj.workspace_id
        elif getattr(obj, "__class__", None).__name__ == "Workspace":
            workspace_id = obj.id
        elif hasattr(obj, "channel") and hasattr(obj.channel, "workspace_id"):
            workspace_id = obj.channel.workspace_id

        if workspace_id:
            from apps.workspaces.models import Workspace, WorkspaceMembership

            return (
                WorkspaceMembership.objects.filter(
                    workspace_id=workspace_id, user=request.user
                ).exists()
                or Workspace.objects.filter(id=workspace_id, owner=request.user).exists()
            )
        return True


class CanAccessDeveloperTools(permissions.BasePermission):
    """Restricts developer tools (Redis inspector, architecture viewer, token debugger) to owner/admin."""

    message = (
        "Developer and system administrative tools are restricted to workspace owners and admins."
    )

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in ("owner", "admin")
                or request.user.is_staff
                or request.user.is_superuser
            )
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Read permissions are allowed to any authenticated request, while write permissions require admin."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ("owner", "admin") or request.user.is_superuser
