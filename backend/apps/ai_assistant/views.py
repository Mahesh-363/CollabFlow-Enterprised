import time

from rest_framework import permissions, views
from rest_framework.response import Response

from .models import AIAssistantQuery
from .service import AIAssistantService


class DailyBriefView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        t0 = time.time()
        brief_markdown = AIAssistantService.generate_daily_brief(request.user)
        latency = int((time.time() - t0) * 1000)

        AIAssistantQuery.objects.create(
            user=request.user,
            action_type="daily_brief",
            prompt="Generate daily briefing",
            response_text=brief_markdown,
            latency_ms=latency,
        )

        return Response(
            {
                "success": True,
                "brief": brief_markdown,
                "generatedAt": int(time.time()),
                "latencyMs": latency,
            }
        )


class ThreadSummaryView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, message_id):
        summary_result = AIAssistantService.summarize_thread(message_id)
        return Response({"success": True, **summary_result})


class RewriteSuggestionView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        text = request.data.get("text", "")
        tone = request.data.get("tone", "professional")
        if not text:
            return Response({"success": False, "message": "Text is required."}, status=400)

        rewritten = AIAssistantService.suggest_rewrite(text, tone)
        return Response({"success": True, "original": text, "rewritten": rewritten})
