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
  shows/            Show, Season
  episodes/         Episode, EpisodeSeason, Character, Transcript,
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
| Episode | UUID | M2M → Character, M2M → Season (via EpisodeSeason) |
| Transcript | UUID | unique_together: (episode, language); language ∈ origin/hebrew/english |
| ProcessingJob | UUID | status ∈ PENDING/RUNNING/COMPLETED/FAILED/STOPPED; append-only log_lines |
| KnowledgeFile | UUID | season XOR show FK (not both) |
| Question | UUID | season XOR show FK; ordered by order_index |

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
