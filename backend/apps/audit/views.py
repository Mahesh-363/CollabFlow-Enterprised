from rest_framework import generics, permissions

from apps.accounts.permissions import CanAccessDeveloperTools

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """Admin-only viewer endpoint for system audit logs."""

    permission_classes = (permissions.IsAuthenticated, CanAccessDeveloperTools)
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.all().select_related("actor")
        action = self.request.query_params.get("action")
        if action:
            queryset = queryset.filter(action__icontains=action)
        return queryset[:100]
