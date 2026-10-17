import uuid
from django.db import models
from apps.accounts.models import User


class AIAssistantQuery(models.Model):
    """Audit log of AI interactions, prompts, models, and token counts."""
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"aiq-{uuid.uuid4().hex[:8]}")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_queries')
    action_type = models.CharField(max_length=50)  # 'daily_brief', 'thread_summary', 'action_items', 'rewrite'
    prompt = models.TextField()
    response_text = models.TextField()
    model_name = models.CharField(max_length=50, default='gemini-2.5-flash')
    latency_ms = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collab_ai_queries'
        ordering = ['-created_at']
