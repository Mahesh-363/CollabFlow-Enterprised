import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.chat.models import Channel
from apps.reminders.models import Reminder
from apps.workspaces.models import Workspace, WorkspaceMembership


@pytest.mark.django_db
class TestWorkspaceAuthorizationReview:
    """Verifies that non-workspace members receive 403 or 404 when attempting unauthorized access."""

    def setup_method(self):
        self.client = APIClient()

        # Workspace A and member
        self.user_a = User.objects.create_user(
            email="user_a@org-a.com",
            password="SecurePassword2026!",
            name="Alice Alpha",
            role="member",
        )
        self.workspace_a = Workspace.objects.create(name="Workspace Alpha", owner=self.user_a)
        WorkspaceMembership.objects.create(
            workspace=self.workspace_a, user=self.user_a, role="owner"
        )

        # Workspace B and intruder
        self.user_b = User.objects.create_user(
            email="user_b@org-b.com",
            password="SecurePassword2026!",
            name="Bob Beta",
            role="member",
        )
        self.workspace_b = Workspace.objects.create(name="Workspace Beta", owner=self.user_b)
        WorkspaceMembership.objects.create(
            workspace=self.workspace_b, user=self.user_b, role="owner"
        )

        # Authenticate as user_b (who is NOT in workspace_a)
        self.client.force_authenticate(user=self.user_b)

    def test_non_member_cannot_create_channel_in_other_workspace(self):
        url = "/api/v1/chat/channels/"
        res = self.client.post(
            url,
            {"workspace_id": self.workspace_a.id, "name": "intruder-channel"},
            format="json",
        )
        assert res.status_code == 403

    def test_non_member_cannot_create_task_in_other_workspace(self):
        url = "/api/v1/tasks/"
        res = self.client.post(
            url,
            {
                "workspace_id": self.workspace_a.id,
                "title": "Unauthorized Task",
                "status": "todo",
                "priority": "low",
            },
            format="json",
        )
        assert res.status_code == 403

    def test_non_member_cannot_create_meeting_in_other_workspace(self):
        url = "/api/v1/meetings/"
        res = self.client.post(
            url,
            {
                "workspace_id": self.workspace_a.id,
                "title": "Unauthorized Meeting",
                "scheduledAt": "2026-10-25T14:00:00Z",
            },
            format="json",
        )
        assert res.status_code == 403

    def test_non_member_cannot_create_whiteboard_in_other_workspace(self):
        url = "/api/v1/whiteboard/"
        res = self.client.post(
            url,
            {"workspace_id": self.workspace_a.id, "title": "Unauthorized Canvas"},
            format="json",
        )
        assert res.status_code == 403

    def test_non_member_cannot_access_other_user_reminder(self):
        reminder_a = Reminder.objects.create(
            workspace=self.workspace_a,
            user=self.user_a,
            title="Alice Private Reminder",
            due_at="2026-10-25T10:00:00Z",
        )
        url = f"/api/v1/reminders/{reminder_a.id}/"
        res = self.client.get(url)
        assert res.status_code == 404

    def test_non_member_cannot_create_poll_in_other_channel(self):
        channel_a = Channel.objects.create(
            workspace=self.workspace_a,
            name="general-a",
            created_by=self.user_a,
        )
        url = "/api/v1/polls/"
        res = self.client.post(
            url,
            {
                "channelId": channel_a.id,
                "question": "Unauthorized Poll?",
                "options": ["Option 1", "Option 2"],
            },
            format="json",
        )
        assert res.status_code == 404

    def test_non_member_cannot_search_other_workspace(self):
        url = f"/api/v1/search/?q=Secret&workspace_id={self.workspace_a.id}"
        res = self.client.get(url)
        assert res.status_code == 403
