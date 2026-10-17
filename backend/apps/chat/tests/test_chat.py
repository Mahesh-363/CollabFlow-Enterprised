import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.chat.models import Channel, Message, Reaction, IdempotencyRecord


@pytest.mark.django_db
class TestChatMessagingAndIdempotency:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='marcus.vance@acme.corp',
            password='TestPass#2026',
            name='Marcus Vance',
            role='member'
        )
        self.client.force_authenticate(user=self.user)
        self.workspace = Workspace.objects.create(
            name='Acme Systems',
            owner=self.user
        )
        WorkspaceMembership.objects.create(
            workspace=self.workspace,
            user=self.user,
            role='owner'
        )
        self.channel = Channel.objects.create(
            workspace=self.workspace,
            name='general',
            created_by=self.user
        )
        self.channel.members.add(self.user)

    def test_send_message_and_idempotency_prevents_duplicates(self):
        url = f"/api/v1/chat/channels/{self.channel.id}/send/"
        idempotency_key = "idemp-client-txn-98765"

        # First send
        res1 = self.client.post(url, {
            'content': 'Deploying v2.4.0 to production cluster',
            'idempotency_key': idempotency_key
        }, format='json')
        assert res1.status_code == 201
        msg_id_1 = res1.data['message']['id']
        assert Message.objects.filter(id=msg_id_1).count() == 1

        # Second send with same idempotency key
        res2 = self.client.post(url, {
            'content': 'Deploying v2.4.0 to production cluster',
            'idempotency_key': idempotency_key
        }, format='json')
        assert res2.status_code == 200
        msg_id_2 = res2.data['message']['id']
        assert msg_id_1 == msg_id_2
        assert Message.objects.filter(channel=self.channel).count() == 1

    def test_toggle_reaction_on_message(self):
        msg = Message.objects.create(
            channel=self.channel,
            user=self.user,
            content='Kafka partition balancing completed'
        )
        url = f"/api/v1/chat/messages/{msg.id}/reaction/"

        # Add reaction
        res1 = self.client.post(url, {'emoji': '🚀'}, format='json')
        assert res1.status_code == 200
        reactions = res1.data['reactions']
        assert len(reactions) == 1
        assert reactions[0]['emoji'] == '🚀'
        assert reactions[0]['count'] == 1
        assert self.user.id in reactions[0]['users']

        # Toggle reaction off
        res2 = self.client.post(url, {'emoji': '🚀'}, format='json')
        assert res2.status_code == 200
        assert len(res2.data['reactions']) == 0
