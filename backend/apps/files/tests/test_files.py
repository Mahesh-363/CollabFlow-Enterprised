import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.files.models import WorkspaceFile
from apps.workspaces.models import Workspace


@pytest.mark.django_db
class TestFileStorageAndValidation:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="james.qa@acme.corp", password="TestPass#2026", name="James QA", role="member"
        )
        self.client.force_authenticate(user=self.user)
        self.workspace = Workspace.objects.create(name="QA Org", owner=self.user)

    def test_upload_valid_document(self):
        file_content = b"PDF mock content for SOC-2 Report"
        upload = SimpleUploadedFile("soc2_audit.pdf", file_content, content_type="application/pdf")

        url = "/api/v1/files/"
        res = self.client.post(
            url, {"workspace_id": self.workspace.id, "file": upload}, format="multipart"
        )
        assert res.status_code == 201
        assert res.data["success"] is True
        assert res.data["file"]["name"] == "soc2_audit.pdf"
        assert res.data["file"]["type"] == "document"
        assert WorkspaceFile.objects.filter(name="soc2_audit.pdf").exists()

    def test_reject_disallowed_extension(self):
        file_content = b"echo hacked"
        upload = SimpleUploadedFile(
            "malicious.exe", file_content, content_type="application/x-msdownload"
        )

        url = "/api/v1/files/"
        res = self.client.post(
            url, {"workspace_id": self.workspace.id, "file": upload}, format="multipart"
        )
        assert res.status_code == 400
        assert "Extension .exe is not allowed" in str(res.data)
