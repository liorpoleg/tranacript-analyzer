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
  show: (id) => `/shows/${id}`,
  showSummaryTable: (id) => `/shows/${id}/summary-table`,
  season: (id) => `/seasons/${id}`,
  episode: (id) => `/episodes/${id}`,
  job: (id) => `/jobs/${id}`,
};
