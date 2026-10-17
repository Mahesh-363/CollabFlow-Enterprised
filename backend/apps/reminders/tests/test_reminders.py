from datetime import timedelta
from django.utils import timezone
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.workspaces.models import Workspace
from apps.reminders.models import Reminder


@pytest.mark.django_db
class TestRemindersSystem:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='lisa.ops@acme.corp',
            password='TestPass#2026',
            name='Lisa Ops',
            role='member'
        )
        self.client.force_authenticate(user=self.user)
        self.workspace = Workspace.objects.create(name='Ops Org', owner=self.user)

    def test_snooze_reminder_delays_dispatch(self):
        rem = Reminder.objects.create(
            workspace=self.workspace,
            user=self.user,
            title='Check Kubernetes memory leak',
            due_at=timezone.now() - timedelta(minutes=5)
        )
        url = f"/api/v1/reminders/{rem.id}/snooze/"
        res = self.client.post(url, {'minutes': 45}, format='json')
        assert res.status_code == 200
        rem.refresh_from_db()
        assert rem.snooze_until is not None
        assert rem.snooze_until > timezone.now()
