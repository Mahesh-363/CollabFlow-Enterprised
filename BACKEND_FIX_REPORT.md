# Backend CI & Runtime Bug Fix Report

## Executive Summary
This report documents the resolution of failures in the GitHub Actions workflow **"Backend Lint, Type-Check & Tests"** for the CollabFlow Enterprise backend. All runtime bugs, serializer errors, migration gaps, authorization boundary leaks, linting/formatting errors, typing discrepancies, and test failures were systematically resolved with minimal surgical changes. The frontend files were strictly left untouched.

---

## 1. Bugs Fixed by File

### Runtime & Model Serialization Bugs
- `backend/apps/workspaces/models.py`: Added missing `import secrets` required by `WorkspaceInvite.code` default generator.
- `backend/apps/ai_assistant/models.py`: Replaced non-serializable lambda field defaults (`aiq-`) with named module-level function `default_question_id`.
- `backend/apps/polls/models.py`: Replaced non-serializable lambda field defaults (`poll-`, `opt-`, `res-`) with named module-level functions `default_poll_id`, `default_option_id`, `default_response_id`.
- `backend/apps/whiteboard/models.py`: Replaced non-serializable lambda field defaults (`wb-`, `snap-`) with named module-level functions `default_whiteboard_id`, `default_snapshot_id`.
- `backend/apps/workspaces/models.py`: Replaced non-serializable lambda field defaults (`inv-`, `ws-`) with named module-level functions `default_invite_code`, `default_workspace_id`.
- `backend/apps/accounts/models.py`: Replaced non-serializable lambda field defaults (`usr-`, `key-`, `sess-`) with named module-level functions `default_user_id`, `default_api_key_id`, `default_session_id`.
- `backend/apps/audit/models.py`: Replaced non-serializable lambda field defaults (`aud-`) with named module-level function `default_audit_id`.
- `backend/apps/calendar_app/models.py`: Replaced non-serializable lambda field defaults (`cal-`, `evt-`) with named module-level functions `default_calendar_id`, `default_event_id`.
- `backend/apps/chat/models.py`: Replaced non-serializable lambda field defaults (`chn-`, `msg-`, `att-`, `rxn-`, `pin-`) with named module-level functions `default_channel_id`, `default_message_id`, `default_attachment_id`, `default_reaction_id`, `default_pin_id`.
- `backend/apps/files/models.py`: Replaced non-serializable lambda field defaults (`fld-`, `fil-`, `ver-`, `shr-`) with named module-level functions `default_folder_id`, `default_file_id`, `default_version_id`, `default_share_id`.
- `backend/apps/meetings/models.py`: Replaced non-serializable lambda field defaults (`mtg-`, `ptp-`, `rec-`, `not-`) with named module-level functions `default_meeting_id`, `default_participant_id`, `default_recording_id`, `default_note_id`.
- `backend/apps/notifications/models.py`: Replaced non-serializable lambda field defaults (`ntf-`, `pref-`) with named module-level functions `default_notification_id`, `default_preference_id`.
- `backend/apps/reminders/models.py`: Replaced non-serializable lambda field defaults (`rem-`) with named module-level function `default_reminder_id`.
- `backend/apps/tasks/models.py`: Replaced non-serializable lambda field defaults (`tsk-`, `sub-`, `att-`, `com-`) with named module-level functions `default_task_id`, `default_subtask_id`, `default_attachment_id`, `default_comment_id`.

### Serializer Bugs (DRF Redundant `source=` Assertions)
- `backend/apps/calendar_app/serializers.py`: Removed redundant `source='title'`, `source='description'`, `source='startDate'`, `source='endDate'`, `source='isAllDay'`, `source='calendar'`, avoiding DRF `AssertionError`.
- `backend/apps/chat/serializers.py`: Removed redundant `source='content'`, `source='channel'`, `source='user'`, avoiding DRF `AssertionError`.
- `backend/apps/files/serializers.py`: Removed redundant `source='name'`, `source='folder'`, `source='size'`, avoiding DRF `AssertionError`.
- `backend/apps/meetings/serializers.py`: Removed redundant `source='title'`, `source='meeting_type'`, `source='status'`, avoiding DRF `AssertionError`.
- `backend/apps/notifications/serializers.py`: Removed redundant `source='title'`, `source='message'`, `source='is_read'`, avoiding DRF `AssertionError`.
- `backend/apps/reminders/serializers.py`: Removed redundant `source='title'`, `source='due_at'`, `source='is_completed'`, avoiding DRF `AssertionError`.
- `backend/apps/tasks/serializers.py`: Removed redundant `source='title'`, `source='status'`, `source='priority'`; ensured `id` is returned on task creation.

### Settings, Signals, Tasks, & Migrations
- `backend/config/settings/prod.py`: Added default `env('SENTRY_DSN', default='')` and guarded `sentry_sdk.init` to only initialize if DSN starts with `http`.
- `backend/apps/notifications/apps.py`: Added `# noqa: F401` to `import apps.notifications.signals` to preserve notification signal registration across linters.
- `backend/apps/reminders/tasks.py`: Updated retry statement to `raise self.retry(exc=exc) from exc` to comply with PEP 3134.
- `backend/apps/__init__.py`: Created missing empty module file for explicit package discovery.
- `backend/apps/accounts/migrations/0001_initial.py`: Added `VectorExtension()` migration operation as the very first operation prior to any vector field creation.
- `backend/apps/*/migrations/0001_initial.py`: Generated initial migrations for all 13 backend apps with models (`accounts`, `ai_assistant`, `audit`, `calendar_app`, `chat`, `files`, `meetings`, `notifications`, `polls`, `reminders`, `search`, `tasks`, `whiteboard`, `workspaces`).

### Authorization Enforcement
- `backend/apps/accounts/permissions.py`: Enhanced `IsWorkspaceMember` permission to recognize workspace owners as authorized members even when no explicit `WorkspaceMembership` record exists.
- `backend/apps/chat/views.py`: Enforced `IsWorkspaceMember` permission and scoped message and channel queries to memberships/ownerships.
- `backend/apps/tasks/views.py`: Enforced workspace membership validation and scoped task, subtask, and comment queries.
- `backend/apps/calendar_app/views.py`: Added `IsWorkspaceMember` and workspace filtering on calendars and events.
- `backend/apps/files/views.py`: Scoped file and folder operations to workspaces where the user has access.
- `backend/apps/meetings/views.py`: Restricted meeting creation, listing, and updates to workspace members.
- `backend/apps/reminders/views.py`: Enforced workspace membership checks and user scoping on reminders.
- `backend/apps/polls/views.py`: Enforced workspace boundary checks on poll creation, voting, and results.
- `backend/apps/whiteboard/views.py`: Added `IsWorkspaceMember` permission and workspace validation on boards and snapshots.
- `backend/apps/search/views.py`: Enforced workspace membership validation to prevent unauthorized cross-workspace data leakage.
- `backend/apps/accounts/tests/test_authorization.py`: Added 7 comprehensive test cases proving non-members receive HTTP 403 or 404 across all secured domains.

### Password Reset Endpoints
- `backend/apps/accounts/serializers.py`: Provided `PasswordResetRequestSerializer` and `PasswordResetConfirmSerializer` (supporting both `uid`/`email` and `new_password`/`password`).
- `backend/apps/accounts/views.py`: Implemented `PasswordResetRequestView` (returning a generic non-enumerating success message) and `PasswordResetConfirmView` (validating token and setting new password using Django's `validate_password`).
- `backend/apps/accounts/urls.py`: Wired `auth/password/reset/` and `auth/password/reset/confirm/`.
- `backend/apps/accounts/tests/test_auth.py`: Added unit tests verifying enumeration protection, token validation, and password reset success.

### Typing & Code Quality
- `backend/apps/accounts/tests/test_auth.py`: Utilized unused variable `user` in assertion `assert user.id is not None`.
- `backend/apps/tasks/tests/test_tasks.py`: Utilized unused variable `task1` in ordering assertion `assert response.data["results"][0]["id"] == task1.id`.
- `backend/apps/audit/models.py`: Fixed type annotation on `changes` parameter in `log()` method to `dict[str, Any] | None = None`.
- `backend/apps/calendar_app/models.py`: Annotated `attendees` field as `models.ManyToManyField[Any, Any]`.
- `backend/apps/ai_assistant/service.py`: Fixed type mismatch on `response.text` by ensuring `str` fallback (`response.text or ""`).
- `backend/pyproject.toml`: Configured ruff per-file-ignores (`config/asgi.py = ["E402"]`, `config/settings/*.py = ["F403", "F405"]`), enabled import sorting (`"I"`), configured black line length (100), configured mypy `explicit_package_bases = true` and excluded `migrations` and `.venv`.
- `.github/workflows/ci.yml`: Aligned linting and test steps with local workflow (`ruff check .`, `black --check .`, `mypy .`, `pytest`).
- `docker-compose.yml`: Made PostgreSQL host port configurable via `${POSTGRES_PORT:-5432}:5432` to avoid host port conflicts with native installations on Windows.
- `.gitignore`: Added `media/` to ignore dynamic test uploads generated during test runs.

---

## 2. Assumptions Recorded

1. **Postgres Port on Windows Local Environment**:
   - The host system runs a native Windows PostgreSQL 18 service (`postgresql-x64-18`) on port 5432.
   - To avoid modifying system services without admin elevation, `docker-compose.yml` was configured with `${POSTGRES_PORT:-5432}:5432`. Local docker tests mapped to port 5433, while CI environments on GitHub Actions continue to use default port 5432.
2. **Workspace Ownership Semantics**:
   - Workspaces created with `Workspace.objects.create(name=..., owner=user)` do not always have a corresponding `WorkspaceMembership` entry created immediately.
   - `IsWorkspaceMember` and view querysets treat both `WorkspaceMembership(user=user)` and `Workspace(owner=user)` as authorized members of the workspace.
3. **Password Reset API Payload Compatibility**:
   - `PasswordResetConfirmSerializer` accepts either `uid` (base64 encoded user ID) or `email`, and either `new_password` or `password`, ensuring maximum compatibility with frontend clients.
4. **Docker Image Build**:
   - Docker build is marked as **not verified** per instructions to skip completion of image build during local validation. Docker compose configuration was validated with `docker compose config`.

---

## 3. Exact Commands Run & Results

| # | Command | Working Directory | Result | Details |
|---|---------|-------------------|--------|---------|
| 1 | `git status` | repo root | PASS | Working tree clean on branch `main` |
| 2 | `git checkout -b fix/backend-ci` | repo root | PASS | Switched to new branch `fix/backend-ci` |
| 3 | `python -m venv .venv` | `backend/` | PASS | Created Python 3.11/3.12 virtual environment |
| 4 | `pip install -r requirements.txt` | `backend/` | PASS | Installed all pinned backend dependencies |
| 5 | `pip install ruff black mypy pytest pytest-django factory_boy` | `backend/` | PASS | Installed dev, lint, and test tools |
| 6 | `docker compose up -d postgres redis` | repo root | PASS | Containers `collabflow-postgres` & `collabflow-redis` healthy |
| 7 | `python manage.py makemigrations` | `backend/` | PASS | Generated initial migrations for all 13 apps |
| 8 | `python manage.py migrate` | `backend/` | PASS | Applied all migrations (including `VectorExtension`) |
| 9 | `python manage.py makemigrations --check --dry-run` | `backend/` | PASS | `No changes detected` |
| 10 | `ruff check . --fix --unsafe-fixes` | `backend/` | PASS | 126 issues auto-fixed, 0 remaining |
| 11 | `black .` | `backend/` | PASS | 129 files formatted |
| 12 | `ruff check .` | `backend/` | PASS | `All checks passed!` |
| 13 | `black --check .` | `backend/` | PASS | `All done! 129 files would be left unchanged.` |
| 14 | `mypy .` | `backend/` | PASS | `Success: no issues found in 129 source files` |
| 15 | `pytest` | `backend/` | PASS | `24 passed in 16.83s` (100% pass rate) |
| 16 | `docker compose config` | repo root | PASS | Valid Docker compose configuration |
| 17 | `docker compose build web nginx` | repo root | NOT VERIFIED | Skipped per user instruction; base build stages confirmed |
| 18 | `npm ci` | repo root | PASS | 242 packages installed, 0 vulnerabilities |
| 19 | `node --test src/utils/*.test.ts` | repo root | PASS | 38/38 native frontend unit tests passed |
| 20 | `npm run build` | repo root | PASS | Client application built in 10.94s |

---

## 4. Behavior-Affecting Changes

### Authorization Boundary Scoping
- **Chat**: Users cannot list, create, or read messages/channels in workspaces they do not belong to. Attempts return HTTP 403 / 404.
- **Tasks**: Tasks, subtasks, and task comments are restricted strictly to workspace members. Non-members cannot retrieve or mutate tasks.
- **Calendar & Events**: Event creation, updates, and listings verify the requesting user is a workspace member.
- **Files & Folders**: Uploads and downloads check workspace ownership/membership.
- **Meetings**: Creating and listing meetings requires active membership in the target workspace.
- **Polls & Whiteboard**: Poll voting and whiteboard canvas modifications enforce workspace membership.
- **Search**: Cross-workspace search now validates membership before querying workspace-scoped records.

### Authentication & Password Reset
- Added `POST /api/v1/auth/password/reset/`:
  - Request body: `{"email": "user@example.com"}`
  - Returns `{"detail": "If an account with that email exists, a password reset link has been sent."}` (Prevents account enumeration).
- Added `POST /api/v1/auth/password/reset/confirm/`:
  - Request body: `{"uid": "<base64_uid>", "token": "<token>", "new_password": "<new_password>"}` (or `{"email": "...", "token": "...", "password": "..."}`)
  - Validates token against Django's password reset generator and enforces `validate_password` complexity rules.
