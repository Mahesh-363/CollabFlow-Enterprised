import uuid

from django.db import models

from apps.accounts.models import User
from apps.workspaces.models import Workspace


def generate_file_id() -> str:
    return f"file-{uuid.uuid4().hex[:8]}"


class WorkspaceFile(models.Model):
    """
    WorkspaceFile model matching TypeScript `WorkspaceFile`:
    { id, name, size, sizeBytes, type, url, uploadedBy, uploadedAt, channelId, taskId }
    """

    TYPE_CHOICES = (
        ("document", "Document"),
        ("image", "Image"),
        ("code", "Source Code"),
        ("media", "Audio / Video Media"),
        ("archive", "Compressed Archive"),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_file_id)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="files")
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="uploaded_files")
    channel_id = models.CharField(max_length=64, blank=True, null=True)
    task_id = models.CharField(max_length=64, blank=True, null=True)

    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="workspace_files/%Y/%m/%d/")
    file_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="document")
    size_bytes = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True, default="")

    # Virus scanning audit metadata
    scan_status = models.CharField(
        max_length=20,
        choices=(
            ("pending", "Pending Scan"),
            ("clean", "Clean / Passed"),
            ("flagged", "Flagged Threat"),
        ),
        default="clean",
    )
    scanned_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "collab_workspace_files"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.file_type}, {self.size})"

    @property
    def sizeBytes(self):
        return self.size_bytes

    @property
    def size(self):
        # Format human-readable string (e.g. 2.4 MB)
        b = self.size_bytes
        if b < 1024:
            return f"{b} B"
        elif b < 1024 * 1024:
            return f"{b / 1024:.1f} KB"
        elif b < 1024 * 1024 * 1024:
            return f"{b / (1024 * 1024):.1f} MB"
        return f"{b / (1024 * 1024 * 1024):.1f} GB"

    @property
    def type(self):
        return self.file_type

    @property
    def url(self):
        return self.file.url if self.file else ""

    @property
    def uploadedBy(self):
        return self.uploaded_by_id

    @property
    def uploadedAt(self):
        return self.created_at.isoformat()

    @property
    def channelId(self):
        return self.channel_id

    @property
    def taskId(self):
        return self.task_id


# ==============================================================================
# Documented Virus-Scan Hook Interface
# (Abstract interface for integration with enterprise ClamAV or VirusTotal scanners)
# ==============================================================================
class IVirusScanner:
    """
    INTERFACE DEFINITION: Production Antivirus Scanner.
    Implementations (e.g., ClamAVDaemonScanner, AWS GuardDutyHook)
    must satisfy this contract.
    """

    def scan_file(self, file_path_or_stream) -> tuple[bool, str]:
        """
        Scans a file buffer or stream.
        Returns: (is_clean: bool, scan_details_or_threat_name: str)
        """
        raise NotImplementedError("Implementations must provide scan_file()")
