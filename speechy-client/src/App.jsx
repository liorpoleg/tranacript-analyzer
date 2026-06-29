import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ShowsPage from './pages/ShowsPage';
import ShowDetailPage from './pages/ShowDetailPage';
import ShowCreatePage from './pages/ShowCreatePage';
import SeasonDetailPage from './pages/SeasonDetailPage';
import EpisodePage from './pages/EpisodePage';
import SummaryTablePage from './pages/SummaryTablePage';
import JobDetailPage from './pages/JobDetailPage';
import UsersPage from './pages/UsersPage';
import OrganizationsPage from './pages/OrganizationsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SessionsPage from './pages/SessionsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import { ROUTES } from './constants/routes';
import ToastProvider from './contexts/ToastContext';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.SHOWS} element={<ShowsPage />} />
                <Route path={ROUTES.SHOW_NEW} element={<ShowCreatePage />} />
                <Route path={ROUTES.SHOW_DETAIL} element={<ShowDetailPage />} />
                <Route path={ROUTES.SHOW_SUMMARY_TABLE} element={<SummaryTablePage />} />
                <Route path={ROUTES.SEASON_DETAIL} element={<SeasonDetailPage />} />
                <Route path={ROUTES.EPISODE_DETAIL} element={<EpisodePage />} />
                <Route path={ROUTES.JOB_DETAIL} element={<JobDetailPage />} />
                <Route path={ROUTES.USERS} element={<UsersPage />} />
                <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
                <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogsPage />} />
                <Route path={ROUTES.SESSIONS} element={<SessionsPage />} />
                <Route path={ROUTES.API_KEYS} element={<ApiKeysPage />} />
                <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  );
}
