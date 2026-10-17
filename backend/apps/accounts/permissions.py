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
        workspace = getattr(obj, 'workspace', obj)
        return hasattr(workspace, 'owner_id') and workspace.owner_id == request.user.id


class IsWorkspaceAdmin(permissions.BasePermission):
    """Allows access to workspace owners and admins."""
    message = "You must be an administrator or owner of this workspace."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ('owner', 'admin') or request.user.is_superuser


class IsWorkspaceMember(permissions.BasePermission):
    """Allows access to workspace members, admins, and owners (excluding guests for sensitive ops)."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ('owner', 'admin', 'member')


class CanAccessDeveloperTools(permissions.BasePermission):
    """Restricts developer tools (Redis inspector, architecture viewer, token debugger) to owner/admin."""
    message = "Developer and system administrative tools are restricted to workspace owners and admins."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ('owner', 'admin') or request.user.is_staff or request.user.is_superuser)
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Read permissions are allowed to any authenticated request, while write permissions require admin."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ('owner', 'admin') or request.user.is_superuser
