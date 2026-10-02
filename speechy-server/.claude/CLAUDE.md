# Speechy Server — Claude Instructions

Django 4.2 REST API. Python 3.11. PostgreSQL + Redis + Celery.

## Running

```bash
# from speechy-server/
python manage.py runserver --settings=speechy.settings.development
python manage.py migrate --settings=speechy.settings.development
python manage.py test apps.episodes --settings=speechy.settings.development
celery -A speechy worker -l info
```

Always pass `--settings=speechy.settings.development` in this environment.

## Project layout

```
speechy/settings/   base.py + development.py + production.py
apps/
  users/            User, Organization, APIKey, UserSession, AuditLog
  shows/            Show (recursive self-referential tree — a "season" is just
                    a Show with `parent` set, there is no separate Season
                    model), ShowMembership, permissions.py (per-show RBAC)
  episodes/         Episode, EpisodeShow, Character, Transcript,
                    EpisodeSummary, ContextualSummary
  knowledge/        KnowledgeFile, Question
  processing/       ProcessingJob + Celery tasks
prompts/            ../prompts/ — LLM prompt templates (loaded at runtime)
```

## Architecture rules

**Thin views → services → tasks.** ViewSets validate input and call a service function. Services contain all business logic. Celery tasks do async LLM work.

- Never put business logic in views or models.
- Never put Django ORM calls in tasks beyond fetching the job by ID.
- Each job type is a separate Celery task function (`translate_task`, `summarize_task`, `contextual_summary_task`). No `if job_type ==` branching.
- `enqueue_job(episode, job_type, user)` in `processing/services.py` is the single entry point to start any job.

**Response envelope** — all endpoints return:
```json
{ "data": ..., "error": null }          // success
{ "data": null, "error": { "code": 400, "message": "..." } }  // failure
```

## Key models

| Model | PK | Notable |
|---|---|---|
| Show | UUID | self-referential `parent` FK (recursive tree, max depth 10) — a "season" is just a Show with `parent` set |
| ShowMembership | UUID | `show` + `user` FK, `role` ∈ owner/editor/viewer; unique_together (show, user); see Permissions below |
| Episode | UUID | M2M → Character, M2M → Show (via EpisodeShow, cross-listing); `primary_show` always points at a root Show |
| Transcript | UUID | unique_together: (episode, language); language ∈ origin/hebrew/english |
| ProcessingJob | UUID | status ∈ PENDING/RUNNING/COMPLETED/FAILED/STOPPED; append-only log_lines |
| KnowledgeFile | UUID | `show` FK — any node in the tree, root or nested |
| Question | UUID | `show` FK — any node in the tree; ordered by order_index |

## Permissions (per-show RBAC)

`apps/shows/permissions.py` is the single source of truth — both the resolution
functions and the DRF permission classes live there (the first DRF permission
classes in the codebase; everywhere else still uses the default `IsAuthenticated`
plus ad-hoc `request.user.role == 'admin'` checks in `get_queryset()`).

- Three roles per show node: `owner` > `editor` > `viewer` (`ShowRole` in `apps/shows/models.py`).
- **Per-node membership with inheritance + override**: a node with no `ShowMembership`
  rows of its own inherits from the nearest ancestor that has any (`get_effective_role`
  walks `show.parent` up to `Show.MAX_DEPTH`). A node that DOES have its own rows fully
  replaces whatever its ancestors have for that subtree — rows never merge across levels.
- Org `ADMIN`-role users (`apps/users/models.py` `Role.ADMIN`) are implicitly `owner` on
  every show in their own org — no `ShowMembership` row needed, checked first in both
  `get_effective_role` and the batched `get_visible_show_ids_for_user`.
- `get_visible_show_ids_for_user(user)` is the batched version used for queryset filtering
  (2 queries total, then an in-memory memoized walk) — used by `get_shows_for_user`,
  `search_shows_by_name`, and (via `apps.episodes.services.get_episodes_for_user`) episode
  visibility. A user with no access to a show gets a 404 on it, not a 403 — it's filtered
  out of `get_queryset()` entirely rather than visible-but-forbidden.
- Episode-level checks (`get_episode_effective_role`) take the highest role across the
  episode's `primary_show` **and** every show it's cross-listed into (`episode.shows`) —
  access via any path counts.
- Contextual summary generation (`EpisodeViewSet.contextual`) is deliberately `viewer`+,
  not `editor`+: it's per-user and driven by the viewer's own view of the active research
  questions, which viewers are already allowed to add. Translate/summarize/upload stay
  `editor`+ since they mutate shared, episode-wide state.
- No backfill migration: `ShowMembership` ships as an empty table. Non-admin users lose
  access to every pre-existing show until an owner/admin re-adds them via
  `POST /api/shows/{id}/members/` — an explicit, confirmed product decision, not an oversight.

## LLM integration

`LLMClient` in `processing/llm_client.py` — one `.complete(prompt)` method.
Endpoint read from `LLM_ENDPOINT` env var (never hardcode).
Prompts loaded from `PROMPTS_DIR/{name}.md` at execution time — editable without restart.

## Environment variables

```bash
SECRET_KEY, DEBUG, ALLOWED_HOSTS, CLIENT_ORIGIN
DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
REDIS_URL
LLM_ENDPOINT    # EXTERNAL_URL — required
LLM_MODEL, LLM_API_KEY
PROMPTS_DIR     # defaults to ../../prompts relative to manage.py
MEDIA_ROOT
```

## Testing

Tests use `APIClient.force_authenticate`. Mock the LLM with `@patch('apps.processing.tasks.LLMClient')`. Test database is created/destroyed per run — no fixtures needed for most tests; use the helper factories in `apps/episodes/tests.py`.

## Migrations

Generate: `python manage.py makemigrations --settings=speechy.settings.development`
Apply: `python manage.py migrate --settings=speechy.settings.development`
New migrations go in `apps/<app>/migrations/`. Depend on the previous migration explicitly.
