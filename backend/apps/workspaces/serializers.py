from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import Workspace, WorkspaceMembership, WorkspaceInvite


class WorkspaceSerializer(serializers.ModelSerializer):
    """Matches TypeScript `Workspace` exactly."""
    ownerId = serializers.CharField(source='owner_id', read_only=True)
    memberCount = serializers.IntegerField(read_only=True)
    channels = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = (
            'id',
            'name',
            'slug',
            'icon',
            'color',
            'ownerId',
            'memberCount',
            'channels',
            'created_at',
        )
        read_only_fields = ('id', 'slug', 'ownerId', 'memberCount', 'channels')

    def get_channels(self, obj):
        # Prevent circular import
        from apps.chat.serializers import ChannelSerializer
        channels = obj.channels.all()[:20]
        return ChannelSerializer(channels, many=True).data


class CreateWorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ('name', 'icon', 'color')


class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    workspaceId = serializers.CharField(source='workspace_id', read_only=True)

    class Meta:
        model = WorkspaceMembership
        fields = ('id', 'workspaceId', 'user', 'role', 'joined_at')


class WorkspaceInviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceInvite
        fields = ('id', 'code', 'role', 'expires_at', 'max_uses', 'used_count')
        read_only_fields = ('id', 'code', 'used_count')
