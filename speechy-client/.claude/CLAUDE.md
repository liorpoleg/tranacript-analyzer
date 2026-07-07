# Speechy Client — Claude Instructions

Vite 5 + React 18 + TypeScript (strict). MUI v5. React Query v4.

## Running

```bash
npm start          # dev server at http://localhost:3000
npx tsc --noEmit   # type check — run after every change
npm run build      # production build to dist/
```

Always run `npx tsc --noEmit` after edits. CI will catch type errors.

## Project layout

```
src/
  api/          One file per resource (auth, shows, episodes, jobs, ...).
                Each exports React Query hooks: useXxx(), useCreateXxx(), etc.
  atoms/        Primitive components — no data fetching, no business logic.
  molecules/    Composite atoms. May receive data via props.
  organisms/    Domain components. May use React Query hooks directly.
  templates/    Layout wrappers (TwoColumnLayout, PageLayout, etc.).
  pages/        Route-level components. One folder per page.
  hooks/        Custom hooks (usePolling, useAuth, useToast, usePageTitle).
  contexts/     ToastContext — the only React context in the app.
  theme/        MUI createTheme + GlobalStyles (@font-face).
  types/        All TypeScript interfaces in one index.ts.
  constants/    routes.ts, api.ts, jobStatus.ts.
  utils/        formatDate, excelHelpers.
  assets/fonts/ Baloo 2 + Plus Jakarta Sans as local woff2.
```

## Architecture rules

**Atomic design is enforced:**
- Atoms have no hooks, no fetching.
- Organisms may call `useQuery`/`useMutation` hooks.
- No prop drilling beyond 2 levels — use React Query cache or `useToast()`.

**API hooks pattern** — every resource has a dedicated hook:
```ts
// api/episodes.ts
export function useEpisode(id: string | undefined) { ... }
export function useUploadTranscript(episodeId: string) { ... }
```
Hooks invalidate related query keys on mutation success. Do not fetch in components directly.

**Polling** — use `usePolling(jobId, { onComplete, onFail })` from `hooks/usePolling.ts`. It polls the job endpoint every 2 s until terminal status, then fires the callback.

**Styling** — MUI `sx` prop only. No inline styles, no CSS modules, no Tailwind.

**Environment** — `VITE_API_URL` (baked at build time by Vite). Accessed via `import.meta.env.VITE_API_URL` in `api/client.ts`.

## Types

All shared types live in `src/types/index.ts`. Key ones:
- `Episode`, `Transcript`, `TranscriptRow`, `Character` — post-schema-change (no raw_excel_path, no featured_characters)
- `TranscriptLanguage` — `'origin' | 'hebrew' | 'english'`
- `ProcessingJob`, `JobStatus`, `JobType`

## State management

**Server state** → React Query (`useQuery`, `useMutation`). Query keys follow `['resource', id]` convention.
**UI state** → local `useState`. Nothing persisted to localStorage except auth (handled server-side via httpOnly cookie).
**Toasts** → `useToast()` from `contexts/ToastContext`.

## Tab structure (EpisodePage)

Tabs: `overview → transcript → translate → summary → contextual → settings`
- `transcript` tab: upload Excel, view origin rows, auto-job status
- `translate` tab: read-only viewer (HE/EN toggle), job history, re-run button

## Routing

Routes defined in `constants/routes.ts` as `ROUTES` (static) and `buildRoute` (dynamic). Register new routes in `src/App.tsx` inside the `ProtectedRoute` wrapper.
