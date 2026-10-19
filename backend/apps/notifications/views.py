from rest_framework import generics, permissions, views
from rest_framework.response import Response

from .models import Notification, NotificationPreference
from .serializers import NotificationPreferenceSerializer, NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")[
            :100
        ]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = queryset.filter(read=False).count()
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {"success": True, "unreadCount": unread_count, "notifications": serializer.data}
        )


class MarkNotificationReadView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        notif = generics.get_object_or_404(Notification, id=id, recipient=request.user)
        notif.read = True
        notif.save(update_fields=["read"])
        return Response({"success": True, "id": id, "read": True})


class MarkAllNotificationsReadView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        updated = Notification.objects.filter(recipient=request.user, read=False).update(read=True)
        return Response({"success": True, "count": updated})


class NotificationPreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        pref, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return pref
