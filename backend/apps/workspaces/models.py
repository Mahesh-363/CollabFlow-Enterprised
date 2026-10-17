import uuid
from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from apps.accounts.models import User


class Workspace(models.Model):
    """
    Workspace model matching TypeScript `Workspace`:
    { id, name, slug, icon, color, ownerId, memberCount, channels }
    """
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"ws-{uuid.uuid4().hex[:8]}")
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True)
    icon = models.CharField(max_length=20, default='CF')
    color = models.CharField(max_length=30, default='#9333ea')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'collab_workspaces'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.slug})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "workspace"
            slug = base_slug
            counter = 1
            while Workspace.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def ownerId(self):
        return self.owner_id

    @property
    def memberCount(self):
        return self.memberships.count()


class WorkspaceMembership(models.Model):
    """User membership and assigned role inside a specific workspace."""
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('guest', 'Guest'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"mem-{uuid.uuid4().hex[:8]}")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspace_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_workspace_memberships'
        unique_together = ('workspace', 'user')

    def __str__(self):
        return f"{self.user.name} in {self.workspace.name} as {self.role}"


class WorkspaceInvite(models.Model):
    """Shareable invitation links with expiration and usage count."""
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"inv-{uuid.uuid4().hex[:8]}")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='invites')
    code = models.CharField(max_length=64, unique=True, default=lambda: f"CF-{secrets.token_hex(4).upper()}")
    role = models.CharField(max_length=20, choices=WorkspaceMembership.ROLE_CHOICES, default='member')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    expires_at = models.DateTimeField()
    max_uses = models.PositiveIntegerField(default=100)
    used_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_workspace_invites'

    def is_valid(self):
        return self.used_count < self.max_uses and self.expires_at > timezone.now()
