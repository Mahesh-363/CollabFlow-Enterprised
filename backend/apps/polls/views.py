from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.chat.models import Channel
from .models import Poll, PollOption, PollVote
from .serializers import PollSerializer, CreatePollSerializer


class PollListCreateView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        channel_id = request.query_params.get('channel_id')
        queryset = Poll.objects.all().prefetch_related('options', 'votes')
        if channel_id:
            queryset = queryset.filter(channel_id=channel_id)
        serializer = PollSerializer(queryset[:20], many=True, context={'request': request})
        return Response({'success': True, 'polls': serializer.data})

    def post(self, request):
        serializer = CreatePollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        channel = get_object_or_404(Channel, id=serializer.validated_data['channelId'])

        poll = Poll.objects.create(
            channel=channel,
            creator=request.user,
            question=serializer.validated_data['question']
        )
        for idx, opt_text in enumerate(serializer.validated_data['options']):
            PollOption.objects.create(poll=poll, text=opt_text, order=idx)

        poll_data = PollSerializer(poll, context={'request': request}).data

        # Broadcast new poll to channel WebSocket group
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"channel_{channel.id}",
                {
                    'type': 'broadcast_poll_created',
                    'poll': poll_data
                }
            )

        return Response({'success': True, 'poll': poll_data}, status=status.HTTP_201_CREATED)


class PollVoteView(views.APIView):
    """Cast a vote on a poll option."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, poll_id):
        poll = get_object_or_404(Poll, id=poll_id)
        if poll.is_closed:
            return Response({'success': False, 'message': 'This poll has ended.'}, status=400)

        option_id = request.data.get('option_id')
        option = get_object_or_404(PollOption, id=option_id, poll=poll)

        # Update or create single vote
        vote, _ = PollVote.objects.update_or_create(
            poll=poll,
            user=request.user,
            defaults={'option': option}
        )

        poll_data = PollSerializer(poll, context={'request': request}).data

        # Broadcast updated poll tally to channel group
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"channel_{poll.channel_id}",
                {
                    'type': 'broadcast_poll_updated',
                    'poll': poll_data
                }
            )

        return Response({'success': True, 'poll': poll_data})
