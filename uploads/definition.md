# TV Show Script Analysis Platform - Ul Generation Brief
## Backstory
A web platform for TV show production teams. Users upload raw episode transcripts, translate them to English or Hebrew, generate structured research reports answering
custom questions, and ask free-text Q&A across episodes.
## Terminology (TV Show / Episode)
| Design Term | Meaning |
1--I--I
| *TV Show* | A container for a series of episodes |
| *Episode* | A single episode, attached to one TV Show |
*Processing Run* | One translation job or report generation job |
| *Transcript* | Raw episode transcript uploaded as Excel (xIsx, xls) |
| *Translated Episode* | Output Excel with translated + summarized content |
/ *Research Question* | A saved question used to guide report generation |
*Background Knowledge* | Uploaded reference files (txt, md, docx, csv) |
| *Report* | DOC output generated from research questions |
| *Production Company* | Multi-tenant organization (enterprise) |
## Core Features
### 1. Translate Episode
Upload a raw transcript Excel. System translates it to English or Hebrew via LLM.
Output is a structured Excel with: Scene ID, Translated Text, Scene Summary, Contextualized Summary (optional), Language, and all original columns preserved.
-*Incremental*: existing scenes are skipped, only new scenes translated
-*Language options*: English (default) or Hebrew/Other
-*Output*: all_translated.xIsx' in the episode's Translated_Episodes folder
### 2. Contextual Summaries (optional, per-scene)
Each scene gets an additional summary weighted by the episode's research
questions. Toggle per episode in settings.
### 3. Research Reports
Select translated episodes, select background knowledge files, select research questions. Generate a DOC report that answers every question with evidence
citations from the transcripts.
- Custom one-off questions can be added per-report (not saved)
- Date range filter to include only rows within a range
- Smart Context toggle (default ON) - uses similarity search to pick only relevant
scenes
###4. Interactive Q&A (Chat)
Select episodes + background files. Ask free-text questions. Get LLM answers with inline evidence citations. Stateless - no history saved between page refreshes.
### 5. Multi-Episode Management
Group episodes under a TV Show. Upload transcripts per episode. Run translate or
reports across any subset.
### 6. Enterprise (Multi-Tenant)
Multiple production companies share the platform. Each has:
- Own TV Shows, Episodes, Users, Audit Logs
- Quotas: max episodes, max users, max storage
- User roles: Admin, Manager, Analyst
- API Keys for external integrations
- Session management (view/revoke active sessions)
---
## Key Pages
### Public / Auth
- /login/ - Username + password, error on failure, redirect to dashboard
### Dashboard (/dashboard/)
- Overview of all TV Shows (card or list)
- Recent Activity feed: last 10 processing runs with type, episode, status badge,
timestamp
- Quick stats: TV Show count, Episode count, Running jobs, Completed today
### TV Shows (/tv-shows/, /tv-shows/new/, /tv-shows/<id>/)
- List: name, description, episode count, org, actions (edit/delete)
- Detail: TV Show header + episode table
- Create/Edit: Name, Description, Organization (if multi-org), Active checkbox
### Episodes (*/episodes/<id>/)
*Episode hub with vertical sidebar (desktop) / horizontal tabs (mobile). Tabs:*
-*Overview* - metadata card, file counts per folder, 3 quick action cards
(Translate, Generate Report, Open Chat), Recent Runs list
_*Translate* (/episodes/<id>/translate/*) - upload area + language radio + Start
button (left), translation history table with View/Download (right)
-*Questions* (/episodes/<id>/questions/*) - saved research questions (left),
background knowledge upload + file list (right)
- *Summary* (/episodes/<id>/summary/') — config panel: episode checkboxes, date range, knowledge files, questions, custom questions textarea, language radio, Smart Context toggle + Generate Report button (left), generated reports list with
Download/Delete (right)
-*Chat* (/episodes/<id>/chat/ - config panel (left), chat card with message
area + input (right)
-*Files* (/episodes/<id>/files/') - file browser for all 5 folders (Input, Questions,
Translated_Episodes, Reports, Background_Knowledge)
-*Settings* (/episodes/<id>/settings/') - Episode Name, Description, Language (radio), Smart Context toggle, Contextual Summaries toggle, Danger Zone with
Delete Episode
### Enterprise Pages
- organizations/* - list/create/edit production companies (name, slug, max
episodes/users/storage)
- /users/ - user table (username, role, org, status, last login) + Create/Edit form
- sessions/ - active sessions table (user, login time, IP, last active) + Revoke action
- audit-logs/ - filterable log table (timestamp, user, action badge, resource, details
expandable)
- /api-keys/' — key list with prefix display + Create modal (full key shown once on
creation) + Revoke
- settings/ - global app settings (org-level config)
### Processing Run Detail (/runs/<id>/')
- Header: run type + status badge
-*Overview* - metadata card, file counts per folder, 3 quick action cards
(Translate, Generate Report, Open Chat), Recent Runs list
_*Translate* (/episodes/<id>/translate/*) - upload area + language radio + Start
button (left), translation history table with View/Download (right)
-*Questions* (/episodes/<id>/questions/*) - saved research questions (left),
background knowledge upload + file list (right)
- *Summary* (/episodes/<id>/summary/') — config panel: episode checkboxes, date range, knowledge files, questions, custom questions textarea, language radio, Smart Context toggle + Generate Report button (left), generated reports list with
Download/Delete (right)
-*Chat* (/episodes/<id>/chat/ - config panel (left), chat card with message
area + input (right)
-*Files* (/episodes/<id>/files/') - file browser for all 5 folders (Input, Questions,
Translated_Episodes, Reports, Background_Knowledge)
-*Settings* (/episodes/<id>/settings/') - Episode Name, Description, Language (radio), Smart Context toggle, Contextual Summaries toggle, Danger Zone with
Delete Episode
### Enterprise Pages
- organizations/* - list/create/edit production companies (name, slug, max
episodes/users/storage)
- /users/ - user table (username, role, org, status, last login) + Create/Edit form
- sessions/ - active sessions table (user, login time, IP, last active) + Revoke action
- audit-logs/ - filterable log table (timestamp, user, action badge, resource, details
expandable)
- /api-keys/' — key list with prefix display + Create modal (full key shown once on
creation) + Revoke
- settings/ - global app settings (org-level config)
### Processing Run Detail (/runs/<id>/')
- Header: run type + status badge
- Metadata: job type, episode, started/completed/duration, triggered by
- Live log panel (monospace, auto-scroll during run, color-coded)
- Download buttons for output files
- Stop Run button (only when Running) with confirm dialog
## User Flow (Complete)
1. *Create TV Show* → Dashboard → TV Shows → + New TV Show
2. *Create Episode* → Inside TV Show → + New Episode (name, language, Smart
Context on, Contextual Summaries on/off)
3. *Add Research Questions* → Episode → Questions tab → + Add Question
4. *Upload Background Knowledge* → Same tab, right panel → drag-and-drop files
5. *Upload & Translate* → Translate tab → upload Excel → Start Translation →
watch Run Detail until Completed → download
6. *Generate Report* → Summary tab → select episodes, knowledge, questions
→ Generate Report → download DOCX
7. *Interactive Q&A* → Chat tab → type question → get answer with citations
## Ul Conventions
-*Navigation*: top navbar (logo + Dashboard/TV Shows/Episodes links + user
menu) + per-episode sidebar tabs
-*Forms*: block-level labels above inputs (never beside), 1.5rem spacing between
groups
- *Tables*: hover highlight, sticky header, overflow-x scroll on mobile
- *Cards*: 'card border-0 shadow-sm', optional hover lift on clickable cards
- *Badges*: colored pills for status (Pending=gray, Running=yellow,
Completed=green, Failed=red, Stopped=orange)
- *Upload area*: dashed border card, drag-over state, file name shown on select
- *Modals*: centered, backdrop overlay, cancel + confirm buttons, close on X or
Escape
- *Toasts*: slide-in top-right, success=green, error=red, info=blue, auto-dismiss 4s
(errors manual)
- *Loading*: button text + spinner on submit, skeleton loaders for page content,
"Thinking..." in chat bubble
- *Responsive*: sidebar becomes top tabs on mobile, two-panel pages stack
vertically
