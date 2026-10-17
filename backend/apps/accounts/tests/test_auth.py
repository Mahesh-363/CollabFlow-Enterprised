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
        url = reverse('account-register')
        data = {
            'name': 'Sarah Connor',
            'email': 'sarah.connor@cyberdyne.corp',
            'password': 'SuperSecurePassword2026!',
            'workspace_name': 'Resistance HQ',
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == 201
        assert response.data['success'] is True
        assert 'tokens' in response.data
        assert response.data['user']['email'] == 'sarah.connor@cyberdyne.corp'
        assert response.data['user']['role'] == 'member'
        assert response.data['workspace']['name'] == 'Resistance HQ'

    def test_login_success_and_jwt_tokens(self):
        user = User.objects.create_user(
            email='alex.rivera@hyperflow.dev',
            password='CollabFlowPass#2026',
            name='Alex Rivera',
            role='admin'
        )
        url = reverse('account-login')
        response = self.client.post(url, {
            'email': 'alex.rivera@hyperflow.dev',
            'password': 'CollabFlowPass#2026'
        }, format='json')
        assert response.status_code == 200
        assert response.data['success'] is True
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        assert response.data['user']['role'] == 'admin'

    def test_presence_heartbeat_updates_status(self):
        user = User.objects.create_user(
            email='elena.vance@acme.corp',
            password='ElenaPass#2026',
            name='Elena Vance',
            role='owner'
        )
        PresenceEngine.record_heartbeat(user.id, socket_id="test_socket_1")
        presence = PresenceEngine.get_user_presence(user.id)
        assert presence['status'] == 'online'
        assert presence['socket_count'] == 1
