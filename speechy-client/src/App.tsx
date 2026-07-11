import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ShowsPage from './pages/ShowsPage';
import ShowDetailPage from './pages/ShowDetailPage';
import ShowCreatePage from './pages/ShowCreatePage';
import SeasonPage from './pages/SeasonPage';
import SeasonSettingsTab from './pages/SeasonPage/SettingsTab';
import SeasonJobsTab from './pages/SeasonPage/JobsTab';
import SeasonChatTab from './pages/SeasonPage/ChatTab';
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

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { user, isLoading } = useAuth();
  if (isLoading) return <></>;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}

export default function App(): JSX.Element {
  return (
    <ToastProvider>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignUpPage />} />
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
                <Route path={ROUTES.SEASON_DETAIL} element={<SeasonPage />}>
                  <Route index element={<SeasonSettingsTab />} />
                  <Route path="jobs" element={<SeasonJobsTab />} />
                  <Route path="chat" element={<SeasonChatTab />} />
                </Route>
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
