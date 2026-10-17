# CollabFlow - Enterprise-Grade Real-Time Collaboration Platform

CollabFlow is a production-grade, enterprise collaboration workspace inspired by Slack, Microsoft Teams, and Discord. It unifies team communication, channels, threaded discussions, WebRTC video meetings, interactive whiteboards, calendar scheduling with conflict detection, Kanban project management, scheduled reminders, rich file sharing, and AI-powered productivity summaries into one cohesive platform.

---

## Architecture Overview

CollabFlow is engineered as a decoupled full-stack architecture combining a high-performance React TypeScript SPA with a resilient Python Django 5 ASGI backend.

```
                           +----------------------------------------+
                           |          Client Web Browsers           |
                           |   React 19 + TypeScript + Tailwind CSS |
                           +-------------------+--------------------+
                                               |
                          HTTP /api/v1/*       |       WebSocket /ws/*
                                               v
                           +----------------------------------------+
                           |           Nginx Reverse Proxy          |
                           |  (Rate limiting, SSL, static routing)  |
                           +-------------------+--------------------+
                                               |
                               +---------------+---------------+
                               |                               |
                               v                               v
               +-------------------------------+   +-----------------------+
               |      Daphne ASGI Server       |   |     Vite Dev Server   |
               |     (HTTP + WebSockets)       |   |     (Port 3000 SPA)   |
               +---------------+---------------+   +-----------------------+
                               |
               +---------------+---------------+
               |    Django 5.x & DRF Engine    |
               |  - SimpleJWT Auth & RBAC      |
               |  - Versioned REST APIs        |
               |  - Channels Consumers         |
               +-------+---------------+-------+
                       |               |
          Database I/O |               | Pub/Sub & Presence
                       v               v
    +----------------------+       +-------------------------+
    |    PostgreSQL 16     |       |        Redis 7.2        |
    |  - Relational Data   |       |  - Channel Layers       |
    |  - pgvector (768-dim)|       |  - Presence Map (TTL)   |
    |  - GIN Text Indices  |       |  - Celery Message Broker|
    +----------------------+       +------------+------------+
                                                |
                               +----------------+----------------+
                               |                                 |
                               v                                 v
               +-------------------------------+ +-------------------------------+
               |     Celery Async Workers      | |       Celery Beat Cron        |
               |  - Reminders & Email Fan-Out  | |  - Expired Token Pruning      |
               |  - AI Daily Brief Generation  | |  - Scheduled Reminder Dispatch|
               |  - Asynchronous Embeddings    | |  - Dead-Letter Log Audits     |
               +-------------------------------+ +-------------------------------+
```

---

## Getting Started: Windows PowerShell & Docker

You can spin up the entire enterprise backend stack with a single command using Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ensure WSL 2 backend is active on Windows)
- Node.js 20+ (for local frontend development)

### Quickstart (Windows PowerShell)

```powershell
# 1. Clone or navigate to the repository
cd C:\Path\To\CollabFlow

# 2. Copy the sample environment configuration
Copy-Item .env.example .env

# 3. Build and launch all backend containers (Postgres, Redis, Daphne, Celery, Nginx)
docker compose up --build -d

# 4. Apply database migrations
docker compose exec backend python manage.py migrate

# 5. Seed initial enterprise demo workspaces, users, channels, tasks, and events
docker compose exec backend python manage.py seed_demo

# 6. View running service health
docker compose ps
docker compose logs -f backend
```

### Quickstart (macOS / Linux Bash)

```bash
# 1. Prepare environment
cp .env.example .env

# 2. Launch container stack
docker compose up --build -d

# 3. Seed demo dataset
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo

# 4. Verify API health
curl http://localhost/api/health/
```

---

## Frontend Integration & Graceful Fallback

CollabFlow features a resilient **Zero-Interruption Architecture**:
- **Live Backend Mode**: When the Docker backend is running, the frontend automatically attaches JWT bearer tokens, streams live WebSocket messages, pushes task state to PostgreSQL, and synchronizes real-time presence.
- **Local In-Memory Mode**: If the backend is not started (e.g. running standalone via `npm run dev` in a preview container), CollabFlow automatically falls back to client-side in-memory persistence and optimistic state. Every button, auth provider, task board, and chat action continues to work seamlessly without throwing errors.
- **Backend Health Indicator**: Available directly inside **Settings > Backend & API** and **Help & Support**, allowing team members to test API latency with one click.

---

## Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | *(auto-generated)* | Cryptographic secret for signing sessions and tokens |
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` | Django settings profile (`dev` or `prod`) |
| `DATABASE_URL` | `postgresql://collabflow:...@db:5432/collabflow` | PostgreSQL connection URL with pgvector |
| `REDIS_URL` | `redis://redis:6379/0` | Redis broker and presence cache URL |
| `GEMINI_API_KEY` | *(optional)* | Google Gemini API key for smart summaries and embeddings |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed origins for cross-origin browser requests |
| `VITE_API_URL` | `/api/v1` | Frontend REST API base URL |
| `VITE_WS_URL` | *(derived from window.location)* | Frontend WebSocket connection URL |

---

## REST API Overview (`/api/v1/`)

All requests except authentication require an `Authorization: Bearer <access_token>` header.

### Standardized Error Format
```json
{
  "error": {
    "code": "permission_denied",
    "message": "Only workspace owners and administrators may modify channel security policies.",
    "status_code": 403,
    "timestamp": "2026-10-17T09:30:00Z"
  }
}
```

### Core API Endpoints

| Resource | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/accounts/register/` | Register user & initialize workspace |
| **Auth** | `POST` | `/api/v1/accounts/login/` | Issue JWT access & refresh tokens |
| **Auth** | `POST` | `/api/v1/accounts/token/refresh/` | Rotate refresh token & obtain new access token |
| **Auth** | `GET` | `/api/v1/accounts/me/` | Current user profile & permission roles |
| **Workspaces** | `GET, POST` | `/api/v1/workspaces/` | List and create team workspaces |
| **Workspaces** | `POST` | `/api/v1/workspaces/{id}/invite/` | Create time-bounded workspace invite link |
| **Chat** | `GET, POST` | `/api/v1/chat/channels/` | Workspace channels (public/private) |
| **Chat** | `GET, POST` | `/api/v1/chat/messages/` | Paginated message stream with attachments |
| **Chat** | `POST` | `/api/v1/chat/messages/{id}/reactions/` | Add/toggle emoji reaction |
| **Chat** | `GET, POST` | `/api/v1/chat/messages/{id}/thread/` | Threaded reply discussion |
| **Tasks** | `GET, POST` | `/api/v1/tasks/` | Kanban task list with subtasks & filters |
| **Tasks** | `POST` | `/api/v1/tasks/{id}/reorder/` | O(1) drag-and-drop fractional reordering |
| **Calendar** | `GET, POST` | `/api/v1/calendar/` | Scheduled events & meetings |
| **Calendar** | `POST` | `/api/v1/calendar/conflicts/` | Detect overlapping schedules across attendees |
| **Meetings** | `POST` | `/api/v1/meetings/instant/` | Launch ad-hoc video conference room |
| **Reminders** | `GET, POST` | `/api/v1/reminders/` | Scheduled reminders with Celery snooze |
| **Files** | `GET, POST` | `/api/v1/files/` | Workspace files with virus-scanning hook |
| **AI** | `POST` | `/api/v1/ai/daily-brief/` | AI-generated workspace executive summary |
| **AI** | `POST` | `/api/v1/ai/action-items/` | Extract tasks and deadlines from discussion |
| **Search** | `GET` | `/api/v1/search/?q={query}` | Hybrid pgvector + full-text search |
| **Health** | `GET` | `/api/health/` | Container liveness & database probe |

---

## WebSocket Event Catalog

Multiplexed real-time WebSocket connection at `ws://<host>/ws/chat/<channel_id>/?token=<jwt>`:

```json
// Client -> Server: Heartbeat
{ "type": "client_heartbeat", "timestamp": 1729157400000 }

// Client -> Server: Send Message
{ "type": "chat_message", "content": "Deployment complete!" }

// Server -> Client: Message Broadcast
{
  "type": "chat.message",
  "payload": {
    "id": "msg-12345",
    "channelId": "ch-engineering",
    "userId": "user-alex",
    "content": "Deployment complete!",
    "createdAt": "2026-10-17T09:30:00Z",
    "reactions": []
  }
}

// Server -> Client: Presence Update
{
  "type": "presence.update",
  "payload": {
    "userId": "user-elena",
    "presence": "online",
    "lastSeen": 1729157400000
  }
}
```

---

## Security Architecture

1. **Authentication & Token Rotation**: SimpleJWT with short-lived access tokens (15m) and single-use rotating refresh tokens (7d). Expired tokens are added to a Redis blacklist and cleaned up periodically via Celery Beat.
2. **Granular RBAC**: Strict object-level permissions enforcing `owner`, `admin`, `member`, and `guest` boundaries. Developer and audit log inspection is restricted to authorized owners and administrators.
3. **Multi-Socket Presence with TTL**: Heartbeats sent every 20 seconds refresh a Redis hash key with a 60-second TTL. If a tab or network terminates abruptly, the user automatically decays to `away` and then `offline`.
4. **Fractional Task Reordering**: Drag-and-drop ordering uses midpoint float indexing (`position = (prev + next) / 2`), eliminating full table rewrites on Kanban moves.
5. **Hybrid Search Architecture**: Combines semantic embeddings with PostgreSQL GIN full-text search (`tsvector`), guaranteeing relevant results even when external AI APIs are offline.

---

## Testing & Quality Assurance

CollabFlow includes comprehensive unit testing across logic and APIs:

```bash
# Run pure logic unit tests (38 tests)
node --test src/utils/*.test.ts

# Run Python backend test suite (when Docker is running)
docker compose exec backend pytest
```
