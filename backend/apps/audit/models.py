import uuid
from django.db import models
from apps.accounts.models import User


class AuditLog(models.Model):
    """
    Immutable audit log for all privileged and destructive workspace actions.
    """
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"aud-{uuid.uuid4().hex[:8]}")
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_entries')
    actor_email = models.EmailField(blank=True)
    action = models.CharField(max_length=100, db_index=True)
    target_type = models.CharField(max_length=50)
    target_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'collab_audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at}] {self.actor_email or 'System'} -> {self.action} ({self.target_type})"

    @classmethod
    def log(cls, request, action: str, target_type: str, target_id: str = "", details: dict = None):
        """Helper to record audit log with request context."""
        ip = None
        user_agent = ""
        actor = None
        email = ""

        if request:
            actor = request.user if request.user and request.user.is_authenticated else None
            email = actor.email if actor else ""
            ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')

        return cls.objects.create(
            actor=actor,
            actor_email=email,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            ip_address=ip,
            user_agent=user_agent[:500],
            details=details or {}
        )
