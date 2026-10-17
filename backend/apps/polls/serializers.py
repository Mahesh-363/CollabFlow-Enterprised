from rest_framework import serializers
from .models import Poll, PollOption, PollVote


class PollOptionSerializer(serializers.ModelSerializer):
    voteCount = serializers.IntegerField(source='vote_count', read_only=True)
    voterIds = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ('id', 'text', 'voteCount', 'voterIds')

    def get_voterIds(self, obj):
        return list(obj.votes.values_list('user_id', flat=True))


class PollSerializer(serializers.ModelSerializer):
    channelId = serializers.CharField(source='channel_id', read_only=True)
    creatorName = serializers.CharField(source='creator.name', read_only=True)
    options = PollOptionSerializer(many=True, read_only=True)
    totalVotes = serializers.SerializerMethodField()
    hasVoted = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', format='iso-8601', read_only=True)

    class Meta:
        model = Poll
        fields = (
            'id',
            'channelId',
            'creatorName',
            'question',
            'options',
            'is_closed',
            'totalVotes',
            'hasVoted',
            'createdAt',
        )

    def get_totalVotes(self, obj):
        return obj.votes.count()

    def get_hasVoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False


class CreatePollSerializer(serializers.Serializer):
    channelId = serializers.CharField()
    question = serializers.CharField(max_length=255)
    options = serializers.ListField(child=serializers.CharField(max_length=150), min_length=2)
