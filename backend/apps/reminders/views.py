from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Reminder
from .serializers import ReminderSerializer, CreateUpdateReminderSerializer


class ReminderListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateUpdateReminderSerializer
        return ReminderSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Reminder.objects.filter(user=user)

        filter_type = self.request.query_params.get('filter')
        now = timezone.now()

        if filter_type == 'completed':
            queryset = queryset.filter(completed=True)
        elif filter_type == 'overdue':
            queryset = queryset.filter(completed=False, due_at__lt=now)
        elif filter_type == 'today':
            start_day = now.replace(hour=0, minute=0, second=0)
            end_day = now.replace(hour=23, minute=59, second=59)
            queryset = queryset.filter(completed=False, due_at__range=(start_day, end_day))
        elif filter_type == 'upcoming':
            queryset = queryset.filter(completed=False, due_at__gt=now)

        return queryset.order_by('due_at')

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace_id') or self.request.headers.get('x-workspace-id')
        from apps.workspaces.models import Workspace
        workspace = Workspace.objects.filter(id=workspace_id).first() or self.request.user.owned_workspaces.first()
        serializer.save(workspace=workspace, user=self.request.user)


class ReminderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'


class ReminderToggleView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        reminder = get_object_or_404(Reminder, id=id, user=request.user)
        reminder.completed = not reminder.completed
        reminder.save(update_fields=['completed'])
        return Response({'success': True, 'reminder': ReminderSerializer(reminder).data})


class ReminderSnoozeView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        reminder = get_object_or_404(Reminder, id=id, user=request.user)
        minutes = int(request.data.get('minutes', 30))
        reminder.snooze_until = timezone.now() + timedelta(minutes=minutes)
        reminder.save(update_fields=['snooze_until'])
        return Response({'success': True, 'reminder': ReminderSerializer(reminder).data})
