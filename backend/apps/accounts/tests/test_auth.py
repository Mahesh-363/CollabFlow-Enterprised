import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.accounts.presence import PresenceEngine


@pytest.mark.django_db
class TestAuthenticationAndRBAC:
    def setup_method(self):
        self.client = APIClient()

    def test_register_creates_user_and_workspace(self):
        url = reverse("account-register")
        data = {
            "name": "Sarah Connor",
            "email": "sarah.connor@cyberdyne.corp",
            "password": "SuperSecurePassword2026!",
            "workspace_name": "Resistance HQ",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["success"] is True
        assert "tokens" in response.data
        assert response.data["user"]["email"] == "sarah.connor@cyberdyne.corp"
        assert response.data["user"]["role"] == "member"
        assert response.data["workspace"]["name"] == "Resistance HQ"

    def test_login_success_and_jwt_tokens(self):
        user = User.objects.create_user(
            email="alex.rivera@hyperflow.dev",
            password="CollabFlowPass#2026",
            name="Alex Rivera",
            role="admin",
        )
        url = reverse("account-login")
        response = self.client.post(
            url,
            {"email": "alex.rivera@hyperflow.dev", "password": "CollabFlowPass#2026"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["success"] is True
        assert "access" in response.data["tokens"]
        assert "refresh" in response.data["tokens"]
        assert response.data["user"]["role"] == "admin"
        assert response.data["user"]["id"] == user.id

    def test_presence_heartbeat_updates_status(self):
        user = User.objects.create_user(
            email="elena.vance@acme.corp",
            password="ElenaPass#2026",
            name="Elena Vance",
            role="owner",
        )
        PresenceEngine.record_heartbeat(user.id, socket_id="test_socket_1")
        presence = PresenceEngine.get_user_presence(user.id)
        assert presence["status"] == "online"
        assert presence["socket_count"] == 1

    def test_password_reset_request_no_user_enumeration(self):
        User.objects.create_user(
            email="reset.user@collabflow.io",
            password="InitialPassword#2026",
            name="Reset User",
            role="member",
        )
        url = reverse("account-password-reset-request")

        # Existing email
        res_existing = self.client.post(url, {"email": "reset.user@collabflow.io"}, format="json")
        assert res_existing.status_code == 200
        assert res_existing.data["success"] is True

        # Non-existing email returns identical response (no enumeration)
        res_nonexistent = self.client.post(
            url, {"email": "does.not.exist@collabflow.io"}, format="json"
        )
        assert res_nonexistent.status_code == 200
        assert res_nonexistent.data["success"] is True
        assert res_nonexistent.data["message"] == res_existing.data["message"]

    def test_password_reset_confirm_success_and_invalid_token(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        user = User.objects.create_user(
            email="target.user@collabflow.io",
            password="OldPassword#2026",
            name="Target User",
            role="member",
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        valid_token = default_token_generator.make_token(user)

        url = reverse("account-password-reset-confirm")

        # Invalid token fails with 400
        bad_res = self.client.post(
            url,
            {"uid": uid, "token": "invalid-token-12345", "password": "NewValidPassword2026!"},
            format="json",
        )
        assert bad_res.status_code == 400

        # Valid token successfully changes password
        good_res = self.client.post(
            url,
            {"uid": uid, "token": valid_token, "password": "NewValidPassword2026!"},
            format="json",
        )
        assert good_res.status_code == 200
        assert good_res.data["success"] is True
        user.refresh_from_db()
        assert user.check_password("NewValidPassword2026!") is True
