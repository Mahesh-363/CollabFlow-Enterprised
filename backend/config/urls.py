"""
Root URL router for CollabFlow backend.
Versioned under /api/v1/
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health_check(request):
    """Liveness probe: returns 200 if the process is responsive."""
    return JsonResponse({'status': 'healthy', 'service': 'collabflow-backend', 'version': '1.0.0'})


def readiness_check(request):
    """
    Readiness probe: checks database and cache readiness.
    """
    db_ok = True
    cache_ok = True
    errors = {}

    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
    except Exception as e:
        db_ok = False
        errors['database'] = str(e)

    try:
        from django.core.cache import cache
        cache.set('__ready_check__', 1, timeout=5)
        if cache.get('__ready_check__') != 1:
            cache_ok = False
            errors['cache'] = 'Cache read/write test failed'
    except Exception as e:
        cache_ok = False
        errors['cache'] = str(e)

    status_code = 200 if (db_ok and cache_ok) else 503
    return JsonResponse({
        'status': 'ready' if (db_ok and cache_ok) else 'degraded',
        'database': db_ok,
        'cache': cache_ok,
        'errors': errors
    }, status=status_code)


urlpatterns = [
    path('admin/', admin.site.urls),

    # Health and readiness probes
    path('api/health/', health_check, name='health-check'),
    path('api/ready/', readiness_check, name='readiness-check'),

    # OpenAPI 3 Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Versioned API routes
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/workspaces/', include('apps.workspaces.urls')),
    path('api/v1/chat/', include('apps.chat.urls')),
    path('api/v1/calendar/', include('apps.calendar_app.urls')),
    path('api/v1/meetings/', include('apps.meetings.urls')),
    path('api/v1/tasks/', include('apps.tasks.urls')),
    path('api/v1/reminders/', include('apps.reminders.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/files/', include('apps.files.urls')),
    path('api/v1/ai/', include('apps.ai_assistant.urls')),
    path('api/v1/search/', include('apps.search.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/polls/', include('apps.polls.urls')),
    path('api/v1/whiteboard/', include('apps.whiteboard.urls')),
]
