export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SHOWS: '/shows',
  SHOW_NEW: '/shows/new',
  SHOW_DETAIL: '/shows/:id',
  SHOW_SUMMARY_TABLE: '/shows/:id/summary-table',
  SEASON_DETAIL: '/seasons/:id',
  EPISODE_DETAIL: '/episodes/:id',
  JOB_DETAIL: '/jobs/:id',
  USERS: '/users',
  ORGANIZATIONS: '/organizations',
  AUDIT_LOGS: '/audit-logs',
  SESSIONS: '/sessions',
  API_KEYS: '/api-keys',
};

export const buildRoute = {
  show: (id: string): string => `/shows/${id}`,
  showSummaryTable: (id: string): string => `/shows/${id}/summary-table`,
  season: (id: string): string => `/seasons/${id}`,
  episode: (id: string): string => `/episodes/${id}`,
  job: (id: string): string => `/jobs/${id}`,
};
