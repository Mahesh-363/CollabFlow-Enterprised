import uuid
from django.db import models
from apps.accounts.models import User
from apps.chat.models import Channel


class Poll(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"poll-{uuid.uuid4().hex[:8]}")
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='polls')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_polls')
    question = models.CharField(max_length=255)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_polls'
        ordering = ['-created_at']

    def __str__(self):
        return f"Poll in #{self.channel.name}: {self.question}"


class PollOption(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"opt-{uuid.uuid4().hex[:8]}")
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=150)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'collab_poll_options'
        ordering = ['order', 'id']

    @property
    def vote_count(self):
        return self.votes.count()


class PollVote(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"pv-{uuid.uuid4().hex[:8]}")
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='votes')
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poll_votes')
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_poll_votes'
        unique_together = ('poll', 'user')  # One vote per user per poll
