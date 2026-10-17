from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CalendarEvent, EventAttendee
from .serializers import (
    CalendarEventSerializer,
    CreateUpdateCalendarEventSerializer,
)


class CalendarEventListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateUpdateCalendarEventSerializer
        return CalendarEventSerializer

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id') or self.request.headers.get('x-workspace-id')
        queryset = CalendarEvent.objects.all().prefetch_related('attendees')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        return queryset.order_by('start_date', 'start_time')

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace_id') or self.request.headers.get('x-workspace-id')
        from apps.workspaces.models import Workspace
        workspace = Workspace.objects.filter(id=workspace_id).first() or self.request.user.owned_workspaces.first()
        serializer.save(workspace=workspace, creator=self.request.user)


class CalendarEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CalendarEvent.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return CreateUpdateCalendarEventSerializer
        return CalendarEventSerializer


class CalendarConflictCheckView(views.APIView):
    """
    Detects scheduling conflicts for attendees across calendar events.
    Input: { start_date, start_time, end_time, attendees: string[] }
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        start_date = request.data.get('start_date')
        start_time = request.data.get('start_time', '09:00')
        end_time = request.data.get('end_time', '10:00')
        attendee_ids = request.data.get('attendees', [])

        if not start_date or not attendee_ids:
            return Response({'hasConflict': False, 'conflicts': []})

        # Query events on the same start_date having shared attendees
        overlapping = CalendarEvent.objects.filter(
            start_date=start_date,
            attendees__id__in=attendee_ids
        ).distinct()

        conflicts = []
        for ev in overlapping:
            # Overlap check
            if not (end_time <= ev.start_time or start_time >= ev.end_time):
                shared = list(set(attendee_ids) & set(ev.attendees.values_list('id', flat=True)))
                conflicts.append({
                    'eventId': ev.id,
                    'eventTitle': ev.title,
                    'startTime': ev.start_time,
                    'endTime': ev.end_time,
                    'conflictingUserIds': shared
                })

        return Response({
            'hasConflict': len(conflicts) > 0,
            'conflicts': conflicts
        })


class EventRSVPView(views.APIView):
    """Update user RSVP status for an event (accepted/tentative/declined)."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, event_id):
        event = get_object_or_404(CalendarEvent, id=event_id)
        rsvp_val = request.data.get('rsvp', 'accepted')
        attendee, _ = EventAttendee.objects.get_or_create(event=event, user=request.user)
        attendee.rsvp = rsvp_val
        from django.utils import timezone
        attendee.responded_at = timezone.now()
        attendee.save()
        return Response({'success': True, 'eventId': event.id, 'rsvp': rsvp_val})
