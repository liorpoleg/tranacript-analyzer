# Speechy Client — Claude Instructions

Vite 5 + React 18 + TypeScript (strict). MUI v5. React Query v4.

## Running

```bash
npm start          # dev server at http://localhost:3000
npx tsc --noEmit   # type check — run after every change
npm run build      # production build to dist/
```

Always run `npx tsc --noEmit` after edits. CI will catch type errors.

## Project layout (core / features architecture)

The codebase is split into `core` (cross-cutting infrastructure, shared with every feature) and `features` (one folder per business domain). This replaced a flat `atoms/molecules/organisms/templates/pages` layout in 2026-09 — see "History" below.

```
src/
  core/
    services/       client.ts (axios instance), auth.ts
    utils/           tokenStorage, formatDate
    hooks/           useAuth, useDebounce, usePageTitle, usePolling
    contexts/        ToastContext — the only React context in the app
    theme/           MUI createTheme + GlobalStyles (@font-face, CSS custom properties)
    types/           all shared TypeScript interfaces, one index.ts
    constants/       routes.ts, api.ts
    components/
      atoms/         AppButton, AppModal, StatusBadge, LanguageToggle, SectionHeader,
                      EmptyState, HighlightedText, UploadArea, SpeechyLogo — generic,
                      no business logic, used across multiple features
      molecules/     AuthHeader (composes SpeechyLogo + title, used by Login/SignUp)
      organisms/      Navbar, TableCard (Card+TableContainer wrapper used by every admin table)
      templates/      PageLayout, TablePageLayout, TwoColumnLayout, AuthLayout
      pages/          LoginPage, SignUpPage, UnauthorizedPage, SsoCallbackPage

  features/
    shows/            services/shows.ts + components/{pages,organisms,molecules}
                      pages: ShowsPage, ShowDetailPage, ShowCreatePage, SummaryTablePage,
                      SeasonPage (+ SeasonSettingsTab/SeasonJobsTab/SeasonChatTab),
                      SeasonDetailPage (orphaned, not routed — see History)
                      organisms: EpisodeTable, ExpandableEpisodeRow, ShowCard, SeasonAccordion
                      molecules: SeasonTabBar
    episodes/         services/episodes.ts + components/{pages,organisms,molecules}
                      pages: EpisodePage (tab hub)
                      organisms: OverviewTab, TranscriptTab, TranslateTab, SummaryTab,
                      ContextualTab, FilesTab (dead — not wired into any tab map),
                      EpisodeSettingsTab, EpisodeChatTab, SidebarNav
                      molecules: TranscriptViewer (shared dialogue-rows list, used by
                      TranscriptTab and TranslateTab)
    knowledge/        services/{knowledge,questions}.ts + components/{organisms,molecules}
                      organisms: KnowledgePanel, QuestionsPanel
                      molecules: KnowledgeFileItem, QuestionItem
    processing/       services/jobs.ts, utils/jobStatus.ts + components/{pages,organisms,molecules}
                      pages: JobDetailPage, SeasonJobsPage (orphaned — see History)
                      organisms: JobLogPanel
                      molecules: JobStatusRow
    chat/             services/chat.ts + components/{organisms,molecules}
                      organisms: ChatPanel, EpisodeChatWorkspace (shared episode-selector +
                      chat two-column layout, used by SeasonChatTab and SeasonDetailPage)
                      molecules: EpisodeSelector
    admin/            services/users.ts (covers users/orgs/sessions/api-keys/audit-logs)
                      + components/pages: UsersPage, OrganizationsPage, AuditLogsPage,
                      SessionsPage, ApiKeysPage — all use core's TableCard
    dashboard/        components/pages/DashboardPage + molecules/{StatCard,ShowListItem}

  App.tsx, main.tsx, env.d.ts   — composition root, stays at src/ (not under core/ or a feature)
  assets/fonts/                — Baloo 2 + Plus Jakarta Sans as local woff2
  test/setup.ts                — vitest setup (referenced by vite.config.ts test.setupFiles)
```

**Where does a new component go?**
- Generic, no business logic, usable by 2+ features → `core/components/atoms|molecules|organisms`.
- A layout wrapper with no business logic → `core/components/templates`.
- Tied to one domain (shows, episodes, knowledge, processing, chat, admin, dashboard) → that feature's `components/{pages,organisms,molecules}`. `organisms` = domain components that may call React Query hooks directly (this includes the `EpisodePage` tab components, even though they render inside one page rather than owning their own route — they fetch their own data and aren't generic enough for `core`). `pages` = route-level components registered in `App.tsx`.
- A feature needing another feature's component (e.g. `shows` pages using `chat`'s `EpisodeChatWorkspace`) is fine — import it directly via its full `@/features/<name>/...` path. There is no per-feature public-API barrel (barrels are banned — see below).

## Import aliases

`@/*` maps to `src/*` (configured in both `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias`). Use it for everything except same-folder sibling imports (`./Foo.module.css`, `./Foo` from a co-located test file) — those stay relative.

## Architecture rules

**Atomic design is enforced, now scoped per-owner (core vs. feature):**
- Atoms have no hooks, no fetching.
- Organisms may call `useQuery`/`useMutation` hooks.
- No prop drilling beyond 2 levels — use React Query cache or `useToast()`.
- No barrel `index.ts` that re-exports everything (causes circular deps). Every component file is named after its component (`ComponentName/ComponentName.tsx`), not `index.tsx` — this applies to `core`/`features` components. Top-level `App.tsx`/`main.tsx` are the only exception (composition root, not a component).

**API hooks pattern** — every resource has a dedicated hook, now living in its feature's `services/` folder (`core/services/` for auth/http):
```ts
// features/episodes/services/episodes.ts
export function useEpisode(id: string | undefined) { ... }
export function useUploadTranscript(episodeId: string) { ... }
```
Hooks invalidate related query keys on mutation success. Do not fetch in components directly.

**Polling** — use `usePolling(jobId, { onComplete, onFail })` from `core/hooks/usePolling.ts`. It polls the job endpoint every 2 s until terminal status, then fires the callback.

**Styling — CSS Modules, one per component folder.** Every component that has any custom styling gets a co-located `ComponentName.module.css` imported as `import styles from './ComponentName.module.css'` and applied via `className`. No inline `style={{}}` and no MUI `sx` prop for layout/spacing/color — this reverses the previous "sx exclusively" rule (2026-09 restructure). Exceptions, in order of preference:
1. A component with **no** custom styling at all (e.g. `AppButton`, a pure prop-forwarding wrapper) needs no `.module.css` — don't manufacture an empty one.
2. A **per-instance dynamic value** (a computed color, a prop-driven width) that a static CSS class can't express: set it as a CSS custom property via the `style` prop (`style={{ '--avatar-color': color } as React.CSSProperties}`) and consume it in the module CSS (`background: var(--avatar-color)`). This is not the same as inline styling — the actual declarations still live in the `.module.css` file.
3. MUI props that aren't styling (`variant`, `color="text.secondary"`, `size`) are fine to keep — they're the component's typed API, not CSS.

**`StyledEngineProvider injectFirst` is mandatory** (`main.tsx`, wraps the whole app). Without it, a CSS Module class and a MUI-injected class of equal specificity are a coin flip — MUI's emotion styles are often inserted into `<head>` *after* Vite's module CSS, so the MUI default silently wins (observed: avatar background, Button/Typography default colors, a mobile nav toggle stuck visible at desktop width). `injectFirst` forces MUI's own styles to load first, so any later stylesheet (including CSS Modules) reliably overrides them. Do not remove this wrapper, and do not "fix" a losing style override by reaching for `!important` first — check this provider is still in place before anything else.
- The one place `!important` is still used is `Navbar.module.css`'s `.mobileMenuButton` (predates confirming the provider fixed the general case) — leave it, don't treat it as the pattern to copy elsewhere.
- Nested-selector nested overrides of MUI internals (`.showSelect :global(.MuiSelect-select) {}`, `.characterChip :global(.MuiChip-label) {}`) are a supported, verified-working pattern for reaching into a MUI component's internal DOM structure.

**Shared design tokens**: `core/theme/GlobalStyles.tsx` defines `:root` CSS custom properties (`--color-primary`, `--color-bg-default`, `--color-text-secondary`, `--radius-card`, etc.) mirroring `core/theme/index.ts`'s palette/shape values, specifically so `.module.css` files (which can't read the JS theme object) stay in sync with the MUI theme. **Keep both files in sync by hand** — there is no single source of truth generating one from the other. If you change a palette color in `theme/index.ts`, update the matching custom property in `GlobalStyles.tsx` too.

## Types

All shared types live in `core/types/index.ts`. Key ones:
- `Episode`, `Transcript`, `TranscriptRow`, `Character` — post-schema-change (no raw_excel_path, no featured_characters)
- `TranscriptLanguage` — `'origin' | 'hebrew' | 'english'`
- `ProcessingJob`, `JobStatus`, `JobType`

## State management

**Server state** → React Query (`useQuery`, `useMutation`). Query keys follow `['resource', id]` convention.
**UI state** → local `useState`. Nothing persisted to localStorage except auth (`speechy_token` in localStorage via `core/utils/tokenStorage.ts` — despite what older docs say about httpOnly cookies, that was never actually implemented; see root `CLAUDE.md` drift notes).
**Toasts** → `useToast()` from `core/contexts/ToastContext`.

## Tab structure (EpisodePage)

Tabs: `overview → transcript → translate → summary → contextual → chat → settings`
- `transcript` tab: upload Excel, view origin rows (via shared `TranscriptViewer`), auto-job status
- `translate` tab: read-only viewer (HE/EN toggle, via the same `TranscriptViewer`), job history, re-run button
- A `files` tab component exists (`features/episodes/components/organisms/FilesTab`) but is **not** wired into `EpisodePage`'s tab map — dead code, kept as-is.

## Routing

Routes defined in `core/constants/routes.ts` as `ROUTES` (static) and `buildRoute` (dynamic). Register new routes in `src/App.tsx` inside the `ProtectedRoute` wrapper, importing the page component from its feature's `components/pages/` folder (or `core/components/pages/` for auth pages).

## History

**2026-09**: full restructure from a flat `src/{atoms,molecules,organisms,templates,pages,api,hooks,contexts,theme,types,constants,utils}` layout to the `core`/`features` split above, and from MUI `sx`-only styling to CSS Modules. Driven by an explicit user request, not a spec change — see git history around that date for the mechanical file-move + `sx`→CSS-Modules conversion. Two pre-existing dead pages (`SeasonDetailPage`, `SeasonJobsPage`) were carried over as-is rather than deleted, since removing unrouted code wasn't part of the ask.
