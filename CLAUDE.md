# Speechy — CLAUDE.md

> This file is the single source of truth for building Speechy. Read it fully before writing any code. When in doubt, ask — do not assume.

---

## 1. What Is Speechy?

Speechy is a web platform for TV production teams. Users upload raw episode transcripts as Excel files, translate them to Hebrew and English via LLM, generate structured episode/season summaries, and produce contextual research summaries guided by background knowledge files and custom questions.

**App name:** Speechy  
**Tagline:** friendly, clean, self-explanatory  
**Theme:** light blue (`#2196f3` / `#1565c0`), white surfaces, 12px border-radius  
**Logo:** cute mascot SVG (speech-bubble character with eyes), placed in the navbar  
**Deployment:** air-gapped — no CDN links, all dependencies pinned and installable offline

---

## 2. Repository Layout

```
speechy/
  CLAUDE.md
  prompts/                    # LLM prompt templates (plain markdown, injected at runtime)
    translate.md
    episode_summary.md
    contextual_summary.md
  speechy-server/             # Django REST API — deployed independently
  speechy-client/             # React SPA — deployed independently
```

The two sub-projects are **independently deployed**. They communicate exclusively over HTTP (REST API). Do not import one into the other.

---

## 3. Domain Terminology

| Term | Meaning |
|---|---|
| **Show** | A TV series — top-level container |
| **Season** | A season within a Show |
| **Episode** | A single episode; can belong to multiple Seasons (many-to-many — backdoor/crossover episodes) |
| **Transcript** | Raw Excel upload — one row per line/scene of dialogue |
| **Translation** | LLM output translating the transcript to Hebrew or English (both always produced) |
| **Episode Summary** | Straight-forward LLM summary of one episode's transcript (no knowledge/questions) |
| **Contextual Summary** | LLM summary using transcript + knowledge files + questions; per-user |
| **Knowledge File** | Background reference file (txt/md/docx/csv) attached to a Show or Season |
| **Question** | A research question attached to a Show or Season; guides contextual summaries |
| **Processing Job** | Async task tracking one LLM operation (translate / summarize / contextual summary) |
| **Organization** | Multi-tenant root — each production company is one org |

---

## 4. Data Model

Design the PostgreSQL schema with strong FK constraints and explicit junction tables. Use `uuid` PKs everywhere.

### Core Hierarchy

```
Organization
  └── Show (many-to-one → Organization)
        └── Season (many-to-one → Show)
              └── EpisodeSeason  ← junction (many-to-many: Season ↔ Episode)
Episode (has a primary Show FK for display purposes; season membership via junction)
```

### Episode & Processing

```
Episode
  ├── EpisodeTranslation (one-to-one per language: "he" | "en")
  │     stores: language, translated_rows (JSONB), created_at, updated_at
  ├── EpisodeSummary (one-to-one)
  │     stores: summary_text, key_topics (array), created_at
  └── ContextualSummary (one-to-many — one per user per question snapshot)
        stores: user FK, questions_snapshot (JSONB), summary_text, created_at
        NOTE: Must be re-run when questions change; old records are not deleted automatically
```

### Supporting Entities

```
KnowledgeFile
  show FK (nullable)     ← either show OR season, never both
  season FK (nullable)
  file_path, original_filename, content_text (extracted at upload time)

Question
  show FK (nullable)     ← either show OR season, never both
  season FK (nullable)
  text, order_index, is_active

ProcessingJob
  episode FK
  job_type ENUM (TRANSLATE | SUMMARIZE | CONTEXTUAL_SUMMARY)
  status ENUM (PENDING | RUNNING | COMPLETED | FAILED | STOPPED)
  triggered_by user FK
  log_lines (JSONB array, append-only)
  started_at, completed_at

User
  organization FK
  role ENUM (ADMIN | MANAGER | ANALYST)
  username, email, password_hash, is_active, last_login

APIKey
  user FK
  key_prefix (first 8 chars shown in UI)
  key_hash (bcrypt hash of the full key)
  created_at, revoked_at (nullable)

UserSession
  user FK
  session_token, ip_address, user_agent, login_at, last_active_at, is_active

AuditLog
  user FK (nullable)
  action (string), resource_type, resource_id, details (JSONB), timestamp
```

### Episode Metadata Fields (on Episode model)

`episode_number`, `title`, `air_date`, `featured_characters` (array of strings), `original_language`, `raw_excel_path`, `show` (FK, primary show), `created_at`, `updated_at`

---

## 5. The Three Core Processes

All three are async LLM calls. Each enqueues a `ProcessingJob` and runs in Celery. The client polls job status.

### 5.1 Translation

- Triggered by: `POST /api/episodes/{id}/translate/`
- Reads: the raw uploaded Excel (one row = one transcript line)
- Calls LLM with: `prompts/translate.md` + transcript rows injected
- Produces: **both** Hebrew (`he`) and English (`en`) translations simultaneously in one LLM call (or two parallel calls — your choice, but both must be saved)
- Saves: one `EpisodeTranslation` per language (upsert — update if already exists)
- Incremental: rows already translated (matched by row ID / scene ID) are skipped
- The user sees a language toggle in the UI; both translations are always stored in DB

### 5.2 Episode Summary

- Triggered by: `POST /api/episodes/{id}/summarize/`
- Reads: the episode's translated transcript (prefer English; fall back to Hebrew)
- Calls LLM with: `prompts/episode_summary.md` + transcript content
- No knowledge files, no questions — pure transcript summary
- Produces: list of key topics + one paragraph summary
- Saves: upserts `EpisodeSummary` (one per episode)

### 5.3 Contextual Summary

- Triggered by: `POST /api/episodes/{id}/contextual/`
- Reads: translated transcript + all active KnowledgeFiles for the episode's season AND show + all active Questions for the season AND show
- Calls LLM with: `prompts/contextual_summary.md` + all context injected
- Saves: creates a **new** `ContextualSummary` record (per user + current question snapshot stored as JSONB)
- This summary is per-user: different users with different questions get different summaries
- The UI must indicate if questions have changed since the last contextual summary was generated

---

## 6. LLM Integration

### Client

All LLM calls go through a single service class: `speechy-server/apps/processing/llm_client.py`

```python
class LLMClient:
    def complete(self, prompt: str) -> str: ...
```

- Makes HTTP POST to `LLM_ENDPOINT` (env var) — treat it as an OpenAI-compatible chat completions endpoint unless specified otherwise
- The endpoint URL must never be hardcoded; always read from env
- Mark the env var with a comment: `# EXTERNAL_URL: LLM API endpoint`

### Prompts

Stored in `speechy/prompts/` (repo root). The server loads them at job execution time, not at startup, so they can be edited without restart. Use `{PLACEHOLDER}` syntax for injected context.

**`prompts/translate.md`** — receives: `{TRANSCRIPT}` (original rows as plain text, one per line)  
**`prompts/episode_summary.md`** — receives: `{TRANSCRIPT}` (translated rows)  
**`prompts/contextual_summary.md`** — receives: `{TRANSCRIPT}`, `{KNOWLEDGE}` (concatenated knowledge file texts), `{QUESTIONS}` (numbered list)

Write sensible starter prompts in each file. They will be tuned by the user later.

---

## 7. Backend: `speechy-server/`

### Stack

| Package | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| Django | 4.2.x | Framework |
| djangorestframework | 3.15.x | REST API |
| djangorestframework-simplejwt | 5.3.x | JWT auth |
| django-cors-headers | 4.3.x | CORS |
| psycopg2-binary | 2.9.x | PostgreSQL driver |
| celery | 5.3.x | Async task queue |
| redis | 5.0.x | Celery broker/backend |
| openpyxl | 3.1.x | Excel parsing |
| python-docx | 1.1.x | DOCX generation |
| python-decouple | 3.8.x | Env var loading |
| Pillow | 10.x | Image handling (optional) |
| requests | 2.31.x | HTTP calls to LLM |

Pin all versions in `requirements.txt` with `==`. No VCS dependencies.

### Directory Structure

```
speechy-server/
  manage.py
  requirements.txt
  .env.example
  speechy/
    __init__.py
    settings/
      base.py
      development.py
      production.py
    urls.py
    wsgi.py
    celery.py
  apps/
    users/
      models.py         # User, Organization, APIKey, UserSession, AuditLog
      serializers.py
      views.py          # ViewSets
      services.py       # Business logic (create_user, revoke_key, etc.)
      urls.py
    shows/
      models.py         # Show, Season, EpisodeSeason
      serializers.py
      views.py
      services.py
      urls.py
    episodes/
      models.py         # Episode, EpisodeTranslation, EpisodeSummary, ContextualSummary
      serializers.py
      views.py
      services.py
      urls.py
    knowledge/
      models.py         # KnowledgeFile, Question
      serializers.py
      views.py
      services.py
      urls.py
    processing/
      models.py         # ProcessingJob
      serializers.py
      views.py          # Job status, stop endpoint
      services.py       # enqueue_job, load_prompt, build_context
      tasks.py          # translate_task, summarize_task, contextual_summary_task
      llm_client.py     # LLMClient class
      urls.py
```

### Coding Conventions

- **Thin views:** ViewSets only validate input, call a service, return a serializer response
- **Services layer:** all business logic in `services.py`; services are plain functions or classes, no Django magic
- **Tasks:** each job type is a separate Celery task function; no `if job_type == ...` branching (OCP)
- **Serializers:** use `ModelSerializer` with explicit `fields`; write base serializers for shared fields
- **Models:** add `__str__`, `Meta.ordering`, and `db_index=True` on FK and filter fields
- **No logic in models** beyond property helpers

### API Endpoints

All endpoints are under `/api/`. All require JWT auth except `/api/auth/`.

```
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/refresh/

GET    /api/organizations/
POST   /api/organizations/
GET    /api/organizations/{id}/
PATCH  /api/organizations/{id}/

GET    /api/shows/
POST   /api/shows/
GET    /api/shows/{id}/
PATCH  /api/shows/{id}/
DELETE /api/shows/{id}/
GET    /api/shows/{id}/seasons/
GET    /api/shows/{id}/questions/
POST   /api/shows/{id}/questions/
GET    /api/shows/{id}/knowledge/
POST   /api/shows/{id}/knowledge/

GET    /api/seasons/
POST   /api/seasons/
GET    /api/seasons/{id}/
PATCH  /api/seasons/{id}/
DELETE /api/seasons/{id}/
GET    /api/seasons/{id}/episodes/
GET    /api/seasons/{id}/questions/
POST   /api/seasons/{id}/questions/
GET    /api/seasons/{id}/knowledge/
POST   /api/seasons/{id}/knowledge/

GET    /api/episodes/
POST   /api/episodes/
GET    /api/episodes/{id}/
PATCH  /api/episodes/{id}/
DELETE /api/episodes/{id}/
POST   /api/episodes/{id}/upload/           # upload raw Excel
POST   /api/episodes/{id}/translate/        # enqueue translation job
POST   /api/episodes/{id}/summarize/        # enqueue summary job
POST   /api/episodes/{id}/contextual/       # enqueue contextual summary job
GET    /api/episodes/{id}/translations/     # list saved translations
GET    /api/episodes/{id}/summary/          # episode summary
GET    /api/episodes/{id}/contextual-summaries/  # user's contextual summaries

DELETE /api/questions/{id}/
DELETE /api/knowledge/{id}/

GET    /api/jobs/
GET    /api/jobs/{id}/
POST   /api/jobs/{id}/stop/

GET    /api/users/
POST   /api/users/
GET    /api/users/{id}/
PATCH  /api/users/{id}/
GET    /api/api-keys/
POST   /api/api-keys/
POST   /api/api-keys/{id}/revoke/
GET    /api/sessions/
POST   /api/sessions/{id}/revoke/
GET    /api/audit-logs/
```

### Environment Variables (Server)

```bash
# .env.example

SECRET_KEY=change-me
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:pass@localhost:5432/speechy
REDIS_URL=redis://localhost:6379/0
CLIENT_ORIGIN=http://localhost:3000

# EXTERNAL_URL: LLM API endpoint — must be set; no default
LLM_ENDPOINT=

# Optional: path to prompts directory (defaults to ../prompts/ relative to manage.py)
PROMPTS_DIR=
```

---

## 8. Frontend: `speechy-client/`

### Stack

| Package | Exact Version | Purpose |
|---|---|---|
| react | 18.2.0 | UI framework |
| react-dom | 18.2.0 | DOM renderer |
| react-router-dom | 6.22.0 | Routing |
| @mui/material | 5.15.x | UI component library |
| @mui/icons-material | 5.15.x | MUI icons |
| @emotion/react | 11.11.x | MUI peer dep |
| @emotion/styled | 11.11.x | MUI peer dep |
| @tanstack/react-query | 4.36.x | Server state / data fetching |
| axios | 1.6.x | HTTP client |
| date-fns | 2.30.x | Date formatting |
| @phosphor-icons/react | 2.1.x | Supplemental icons |
| react-dropzone | 14.2.x | Drag-and-drop file upload |
| react-virtuoso | 4.7.x | Virtualized tables (summary table) |

Add `"private": true` to `package.json`. Pin all with exact versions (`"react": "18.2.0"` not `"^18.2.0"`). No CDN `<link>` or `<script>` tags in `public/index.html`.

**Fonts:** Download `Baloo 2` (headings) and `Plus Jakarta Sans` (body) as woff2 files. Place in `src/assets/fonts/`. Load via `@font-face` in MUI theme `GlobalStyles`. Do NOT use Google Fonts URL.

### Atomic Design Structure

```
src/
  api/
    client.js             # Axios instance (baseURL from env, withCredentials: true)
    shows.js              # useShows(), useShow(), useCreateShow(), etc.
    seasons.js
    episodes.js
    jobs.js
    knowledge.js
    questions.js
    auth.js
    users.js
    admin.js

  atoms/
    AppButton.jsx         # MUI Button wrapper with loading state
    StatusBadge.jsx       # colored chip: PENDING/RUNNING/COMPLETED/FAILED/STOPPED
    UploadArea.jsx        # react-dropzone dashed card
    AppModal.jsx          # centered modal with backdrop, cancel+confirm
    AppToast.jsx          # slide-in top-right toast (success/error/info)
    LanguageToggle.jsx    # HE / EN pill toggle
    SectionHeader.jsx     # page section heading with optional action button

  molecules/
    EpisodeRow.jsx        # one row in an episode table
    JobStatusRow.jsx      # one row in a processing runs list
    QuestionItem.jsx      # editable/deletable question line
    KnowledgeFileItem.jsx # file name + delete + download
    StatCard.jsx          # dashboard stat chip (label + big number + icon)

  organisms/
    Navbar.jsx            # sticky top nav: logo + links + user menu + theme toggle
    ShowCard.jsx          # TV show card (grid view)
    EpisodeTable.jsx      # full filterable episode table (uses react-virtuoso)
    TranslationPanel.jsx  # upload area + language selection + job history
    SummaryPanel.jsx      # display episode summary + re-run button
    ContextualPanel.jsx   # display contextual summary + questions status + re-run
    JobLogPanel.jsx       # monospace auto-scrolling live log
    SeasonAccordion.jsx   # collapsible season with episode list
    SidebarNav.jsx        # episode page vertical tabs
    KnowledgePanel.jsx    # knowledge file list + upload
    QuestionsPanel.jsx    # question list + add/delete

  templates/
    TwoColumnLayout.jsx   # left config panel + right content panel
    TabLayout.jsx         # page with sidebar tabs (desktop) / top tabs (mobile)
    TablePageLayout.jsx   # header + filter bar + full-width table

  pages/
    LoginPage/
    DashboardPage/
    ShowsPage/
    ShowDetailPage/       # seasons + episodes per season
    ShowCreatePage/
    SeasonDetailPage/
    EpisodePage/          # tab hub
      tabs/
        OverviewTab.jsx
        TranslateTab.jsx
        SummaryTab.jsx
        ContextualTab.jsx
        FilesTab.jsx
        SettingsTab.jsx
    SummaryTablePage/     # per-show filterable summary grid
    JobDetailPage/
    UsersPage/
    OrganizationsPage/
    AuditLogsPage/
    SessionsPage/
    ApiKeysPage/

  hooks/
    usePolling.js         # polls a URL every N ms until status is terminal
    useToast.js           # toast notification state
    useAuth.js            # current user, login, logout
    usePageTitle.js       # sets document.title

  theme/
    index.js              # MUI createTheme — light blue palette, fonts, border-radius
    GlobalStyles.jsx      # @font-face declarations, scrollbar styles

  constants/
    routes.js             # route path strings
    jobStatus.js          # PENDING, RUNNING, COMPLETED, FAILED, STOPPED
    api.js                # API base path segments

  utils/
    formatDate.js
    excelHelpers.js       # parse/validate Excel column names

  App.jsx                 # router, QueryClientProvider, ThemeProvider
  main.jsx                # ReactDOM.createRoot
```

### HTTP Communication

```js
// src/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL,  // e.g. http://localhost:8000
  withCredentials: true,                   // send JWT cookie
});

export default client;
```

- JWT is stored in an `httpOnly` cookie set by the server on login — **not** in localStorage
- The server must set `Access-Control-Allow-Credentials: true` and the correct `Access-Control-Allow-Origin` matching `CLIENT_ORIGIN`
- React Query handles caching and refetching; write one hook per resource (e.g. `useEpisode(id)`)
- Job status polling: use `usePolling` hook that calls the job status endpoint every 2 seconds until status is `COMPLETED | FAILED | STOPPED`, then invalidates related queries

### Environment Variables (Client)

```bash
# .env.example
REACT_APP_API_URL=http://localhost:8000
```

### Theme

```js
// src/theme/index.js — approximate values
{
  palette: {
    primary: { main: '#2196f3', dark: '#1565c0', light: '#64b5f6' },
    background: { default: '#f4f6fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Baloo 2", cursive', fontWeight: 800 },
    h2: { fontFamily: '"Baloo 2", cursive', fontWeight: 700 },
  },
}
```

---

## 9. Key Pages & UX Details

### Dashboard
- Grid of Show cards (name, season count, episode count, org)
- Recent Activity list: last 10 ProcessingJobs across all shows (type badge, episode name, status badge, timestamp)
- Stats row: total shows, total episodes, running jobs, completed today

### Show Detail Page (`/shows/:id/`)
- Show header (name, description, edit/delete buttons)
- Seasons list as accordions — each expands to an episode table
- "Add Season" button
- Per-season "Add Episode" button

### Episode Page (`/episodes/:id/`)
- Breadcrumb: Dashboard → Show → Episode
- Vertical sidebar (desktop) / horizontal top tabs (mobile)
- **Overview tab:** metadata card (episode #, air date, featured characters, language), file counts, quick action cards (Translate / Summarize / Contextual), recent jobs list
- **Translate tab:** upload area + display language selector + Start button (left panel); translation job history with View/Download (right panel)
- **Summary tab:** shows the straight-forward episode summary text + key topics chips; "Re-run Summary" button
- **Contextual tab:** shows latest contextual summary for current user; shows the questions that were used; warning banner if questions have changed since last run; "Re-run" button
- **Files tab:** file browser for uploaded Excel, knowledge files, generated outputs
- **Settings tab:** edit name, language, danger zone (delete episode)

### Summary Table Page (`/shows/:id/summary-table/`)
- Full-width filterable data grid for all episodes of a show
- Columns: Episode #, Title, Air Date, Featured Characters, Translated Transcript (expandable, HE/EN toggle), Episode Summary, Contextual Summary (latest), Job Status
- Filter bar: season filter, date range, search by title/character
- Export to CSV button

### Processing Job Detail (`/jobs/:id/`)
- Header: job type + status badge
- Metadata: episode, started/completed/duration, triggered by user
- Live log panel: monospace, auto-scrolling, appends new log lines while RUNNING
- Stop button (only when RUNNING) with confirmation dialog
- Download output button (when COMPLETED)

---

## 10. Code Quality Rules

### Universal
- No comments that explain *what* code does — only *why* (non-obvious constraints, workarounds)
- No features beyond what is specified here — no speculative abstractions
- No half-finished implementations — every function must be complete or not written at all

### Django
- SOLID: SRP (one responsibility per service function), OCP (new job type = new Celery task, no `if job_type` chains)
- DRY: shared serializer base classes, shared pagination class, shared error response format
- Every endpoint returns consistent JSON: `{ "data": ..., "error": null }` on success, `{ "data": null, "error": { "code": ..., "message": ... } }` on failure
- Use Django signals only for audit logging — not for business logic

### React
- Atomic design is enforced: atoms have no data fetching, organisms can use hooks
- No prop drilling beyond 2 levels — use React Query cache or React Context
- No inline styles — use MUI `sx` prop exclusively
- Every component in its own file; no barrel `index.js` that re-exports everything (causes circular deps)
- Custom hooks for all data fetching and side effects
- `useCallback` / `useMemo` only when there is a measurable performance reason

---

## 11. Air-Gap Checklist

Before writing any code, confirm:

- [ ] Every `import` or `require` resolves to a package in `requirements.txt` or `package.json`
- [ ] No `<link href="https://...">` or `<script src="https://...">` in any HTML template
- [ ] No `fetch('https://...')` hardcoded URLs — use env vars
- [ ] Fonts are local woff2 files in `src/assets/fonts/`
- [ ] MUI icons come from `@mui/icons-material` npm package
- [ ] Phosphor icons come from `@phosphor-icons/react` npm package (not unpkg)
- [ ] `LLM_ENDPOINT` is the only external URL, loaded from env, commented with `# EXTERNAL_URL`
- [ ] `requirements.txt` uses `==` for all versions
- [ ] `package.json` uses exact versions (no `^` or `~`)

---

## 12. Development Setup

### Server

```bash
cd speechy-server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, REDIS_URL, LLM_ENDPOINT
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver  # API at http://localhost:8000
# In a separate terminal:
celery -A speechy worker -l info
```

### Client

```bash
cd speechy-client
npm install
cp .env.example .env        # set REACT_APP_API_URL=http://localhost:8000
npm start                   # SPA at http://localhost:3000
```

---

## 13. Verification Checklist

After building, verify these flows end-to-end:

1. **Auth:** POST `/api/auth/login/` with valid credentials → JWT cookie set → `GET /api/shows/` succeeds → dashboard loads
2. **Create Show → Season → Episode:** forms work, entities appear in DB with correct FK relationships
3. **Upload Excel:** POST to `/api/episodes/{id}/upload/` with an `.xlsx` file → file saved, episode updated
4. **Translate:** POST `/api/episodes/{id}/translate/` → job created (PENDING) → Celery processes → job COMPLETED → two `EpisodeTranslation` records exist (he + en) → UI language toggle switches between them
5. **Episode Summary:** POST `/api/episodes/{id}/summarize/` → job COMPLETED → `EpisodeSummary` record exists → summary visible in UI
6. **Add Knowledge + Questions:** add a knowledge file and a question to a season → verify they appear in the contextual summary prompt context
7. **Contextual Summary:** POST `/api/episodes/{id}/contextual/` → job COMPLETED → `ContextualSummary` created with questions_snapshot → UI shows summary and the questions used
8. **Summary Table:** navigate to `/shows/{id}/summary-table/` → all episodes listed, HE/EN toggle works, season filter works
9. **Job Detail:** click a job → live log streams while RUNNING, Stop button works
10. **Air-gap:** `npm install --offline` and `pip install --no-index -r requirements.txt` both succeed from a local mirror

---

## 14. What To Ask Before Building

If anything below is unclear, ask before writing code:

- The exact shape of the Excel files users upload (column names, row format) — confirm with the user or write flexible parsing that tolerates variation
- The LLM API format (`LLM_ENDPOINT`) — is it OpenAI-compatible? What's the model name? These should be env vars
- Whether contextual summaries should be scoped per-user per-episode, or per-user per-show (current spec: per-user per-episode)
- Storage backend for uploaded files — local filesystem is assumed; confirm if S3 or similar is needed
