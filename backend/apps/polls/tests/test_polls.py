import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.workspaces.models import Workspace
from apps.chat.models import Channel
from apps.polls.models import Poll, PollOption, PollVote


@pytest.mark.django_db
class TestPollsAndVoting:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='poll.voter@acme.corp',
            password='TestPass#2026',
            name='Poll Voter',
            role='member'
        )
        self.client.force_authenticate(user=self.user)
        self.workspace = Workspace.objects.create(name='Poll Org', owner=self.user)
        self.channel = Channel.objects.create(workspace=self.workspace, name='team-decisions', created_by=self.user)

    def test_create_poll_and_cast_vote(self):
        # Create poll
        url = '/api/v1/polls/'
        res = self.client.post(url, {
            'channelId': self.channel.id,
            'question': 'Which database for high-throughput messaging cache?',
            'options': ['Redis 7.2 Cluster', 'DragonflyDB', 'KeyDB']
        }, format='json')
        assert res.status_code == 201
        poll_id = res.data['poll']['id']
        opt_id = res.data['poll']['options'][0]['id']

        # Cast vote
        vote_url = f"/api/v1/polls/{poll_id}/vote/"
        vote_res = self.client.post(vote_url, {'option_id': opt_id}, format='json')
        assert vote_res.status_code == 200
        assert vote_res.data['poll']['totalVotes'] == 1
        assert vote_res.data['poll']['hasVoted'] is True
