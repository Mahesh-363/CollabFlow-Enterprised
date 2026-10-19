import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


def generate_user_id() -> str:
    return f"user-{uuid.uuid4().hex[:8]}"


class UserManager(BaseUserManager):
    """Custom user manager supporting email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required")
        email = self.normalize_email(email)
        if "id" not in extra_fields or not extra_fields["id"]:
            extra_fields["id"] = generate_user_id()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "owner")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model designed to 1:1 match the TypeScript CollabFlow User interface:
    id, name, email, avatar, title, role, presence, customStatus, isBot
    """

    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("member", "Member"),
        ("guest", "Guest"),
    )

    PRESENCE_CHOICES = (
        ("online", "Online"),
        ("away", "Away"),
        ("offline", "Offline"),
        ("dnd", "Do Not Disturb"),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_user_id)
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=150)
    avatar = models.CharField(max_length=20, default="U")
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    title = models.CharField(max_length=150, default="Team Member")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    presence = models.CharField(max_length=20, choices=PRESENCE_CHOICES, default="offline")
    custom_status = models.CharField(max_length=200, blank=True, default="")
    is_bot = models.BooleanField(default=False)

    # 2FA (TOTP)
    totp_secret = models.CharField(max_length=64, blank=True, null=True)
    totp_enabled = models.BooleanField(default=False)
    recovery_codes = models.JSONField(default=list, blank=True)

    # Status & Audit
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_heartbeat = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "collab_users"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} <{self.email}> ({self.role})"

    @property
    def customStatus(self):
        return self.custom_status

    @property
    def isBot(self):
        return self.is_bot
