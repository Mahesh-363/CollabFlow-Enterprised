import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.mark.django_db
class TestAIAssistantFallback:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="morgan.pm@acme.corp", password="TestPass#2026", name="Morgan PM", role="member"
        )
        self.client.force_authenticate(user=self.user)

    def test_daily_brief_graceful_fallback_without_api_key(self):
        url = "/api/v1/ai/daily-brief/"
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "Good morning, Morgan PM" in res.data["brief"]
        assert "CollabFlow Intelligent Assistant" in res.data["brief"]

    def test_rewrite_suggestions(self):
        url = "/api/v1/ai/rewrite/"
        res = self.client.post(
            url,
            {"text": "We completed the deployment successfully", "tone": "executive"},
            format="json",
        )
        assert res.status_code == 200
        assert "Executive Summary" in res.data["rewritten"]
