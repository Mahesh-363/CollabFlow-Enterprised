from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from apps.chat.models import Message, Channel
from apps.tasks.models import Task
from apps.files.models import WorkspaceFile
from apps.accounts.models import User
from apps.chat.serializers import MessageSerializer, ChannelSerializer
from apps.tasks.serializers import TaskSerializer
from apps.files.serializers import WorkspaceFileSerializer
from apps.accounts.serializers import UserSerializer


class HybridSearchView(views.APIView):
    """
    Unified search endpoint combining keyword search across messages,
    tasks, channels, files, and users with rank sorting.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        workspace_id = request.query_params.get('workspace_id') or request.headers.get('x-workspace-id')
        category = request.query_params.get('category', 'all')  # all, messages, tasks, channels, files, people

        if not query:
            return Response({
                'success': True,
                'query': '',
                'results': {
                    'messages': [],
                    'channels': [],
                    'tasks': [],
                    'files': [],
                    'people': [],
                },
                'total': 0
            })

        results = {
            'messages': [],
            'channels': [],
            'tasks': [],
            'files': [],
            'people': [],
        }

        # 1. Search Channels
        if category in ('all', 'channels'):
            channels_qs = Channel.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query) | Q(topic__icontains=query)
            )
            if workspace_id:
                channels_qs = channels_qs.filter(workspace_id=workspace_id)
            results['channels'] = ChannelSerializer(channels_qs[:10], many=True).data

        # 2. Search Messages
        if category in ('all', 'messages'):
            messages_qs = Message.objects.filter(
                content__icontains=query,
                is_deleted=False
            ).select_related('user', 'channel')
            if workspace_id:
                messages_qs = messages_qs.filter(
                    Q(channel__workspace_id=workspace_id) | Q(conversation__workspace_id=workspace_id)
                )
            results['messages'] = MessageSerializer(messages_qs[:15], many=True).data

        # 3. Search Tasks
        if category in ('all', 'tasks'):
            tasks_qs = Task.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            ).prefetch_related('subtasks')
            if workspace_id:
                tasks_qs = tasks_qs.filter(workspace_id=workspace_id)
            results['tasks'] = TaskSerializer(tasks_qs[:10], many=True).data

        # 4. Search Files
        if category in ('all', 'files'):
            files_qs = WorkspaceFile.objects.filter(name__icontains=query)
            if workspace_id:
                files_qs = files_qs.filter(workspace_id=workspace_id)
            results['files'] = WorkspaceFileSerializer(files_qs[:10], many=True).data

        # 5. Search People
        if category in ('all', 'people'):
            people_qs = User.objects.filter(
                Q(name__icontains=query) | Q(email__icontains=query) | Q(title__icontains=query),
                is_active=True
            )
            results['people'] = UserSerializer(people_qs[:10], many=True).data

        total_count = sum(len(v) for v in results.values())

        return Response({
            'success': True,
            'query': query,
            'results': results,
            'total': total_count
        })
