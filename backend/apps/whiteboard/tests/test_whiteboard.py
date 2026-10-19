import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.workspaces.models import Workspace


@pytest.mark.django_db
class TestWhiteboardCanvas:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="artist.eng@acme.corp", password="TestPass#2026", name="Artist Eng", role="member"
        )
        self.client.force_authenticate(user=self.user)
        self.workspace = Workspace.objects.create(name="Canvas Org", owner=self.user)

    def test_create_and_update_whiteboard_snapshot(self):
        url = "/api/v1/whiteboard/"
        res = self.client.post(
            url,
            {"workspace_id": self.workspace.id, "title": "Distributed Topology v3"},
            format="json",
        )
        assert res.status_code == 201
        board_id = res.data["id"]

        # Update snapshot
        detail_url = f"/api/v1/whiteboard/{board_id}/"
        snapshot = {"strokes": [{"points": [10, 20, 30, 40], "color": "#9333ea", "width": 3}]}
        patch_res = self.client.patch(detail_url, {"snapshot_data": snapshot}, format="json")
        assert patch_res.status_code == 200
        assert patch_res.data["snapshot_data"]["strokes"][0]["color"] == "#9333ea"
