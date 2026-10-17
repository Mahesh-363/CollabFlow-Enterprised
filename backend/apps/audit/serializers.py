from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actorName = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            'id',
            'action',
            'target_type',
            'target_id',
            'actor_email',
            'actorName',
            'ip_address',
            'user_agent',
            'details',
            'created_at',
        )

    def get_actorName(self, obj):
        return obj.actor.name if obj.actor else 'System'
