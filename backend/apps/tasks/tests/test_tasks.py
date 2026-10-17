import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.tasks.models import Task, TaskSubtask


@pytest.mark.django_db
class TestTaskManagement:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='sarah.lead@acme.corp',
            password='TestPass#2026',
            name='Sarah Lead',
            role='admin'
        )
        self.client.force_authenticate(user=self.user)
        self.workspace = Workspace.objects.create(name='Sprint Org', owner=self.user)
        WorkspaceMembership.objects.create(workspace=self.workspace, user=self.user, role='owner')

    def test_create_task_with_subtasks(self):
        url = '/api/v1/tasks/'
        payload = {
            'workspace_id': self.workspace.id,
            'title': 'Implement SOC-2 RBAC Middleware',
            'description': 'Ensure guest accounts cannot execute write endpoints',
            'status': 'todo',
            'priority': 'high',
            'dueDate': '2026-10-25',
            'subtasks': [{'title': 'Write unit tests'}, {'title': 'Audit logs validation'}]
        }
        res = self.client.post(url, payload, format='json')
        assert res.status_code == 201
        task_id = res.data['id']
        assert Task.objects.filter(id=task_id).exists()
        assert TaskSubtask.objects.filter(task_id=task_id).count() == 2

    def test_reorder_task_fractional_indexing(self):
        task1 = Task.objects.create(workspace=self.workspace, creator=self.user, title='Task 1', order_index=1000.0)
        task2 = Task.objects.create(workspace=self.workspace, creator=self.user, title='Task 2', order_index=2000.0)

        # Place task2 before task1
        url = f"/api/v1/tasks/{task2.id}/reorder/"
        res = self.client.post(url, {'next_order_index': 1000.0}, format='json')
        assert res.status_code == 200
        task2.refresh_from_db()
        assert task2.order_index == 500.0
