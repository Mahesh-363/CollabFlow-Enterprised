import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.calendar_app.models import CalendarEvent, EventAttendee
from apps.workspaces.models import Workspace


@pytest.mark.django_db
class TestCalendarConflictDetection:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="david.eng@acme.corp", password="TestPass#2026", name="David Eng", role="member"
        )
        self.client.force_authenticate(user=self.user)
        self.workspace = Workspace.objects.create(name="Calendar Org", owner=self.user)

    def test_conflict_detection_identifies_collision(self):
        # Create existing meeting 10:00 to 11:00
        ev = CalendarEvent.objects.create(
            workspace=self.workspace,
            creator=self.user,
            title="Architecture Review",
            start_date="2026-10-20",
            start_time="10:00",
            end_date="2026-10-20",
            end_time="11:00",
        )
        EventAttendee.objects.create(event=ev, user=self.user)

        # Check overlapping slot 10:30 to 11:30
        url = "/api/v1/calendar/conflicts/"
        res = self.client.post(
            url,
            {
                "start_date": "2026-10-20",
                "start_time": "10:30",
                "end_time": "11:30",
                "attendees": [self.user.id],
            },
            format="json",
        )
        assert res.status_code == 200
        assert res.data["hasConflict"] is True
        assert len(res.data["conflicts"]) == 1
        assert res.data["conflicts"][0]["eventId"] == ev.id
