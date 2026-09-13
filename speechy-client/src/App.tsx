import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks/useAuth';
import { getToken } from '@/core/utils/tokenStorage';
import LoginPage from '@/core/components/pages/LoginPage/LoginPage';
import SignUpPage from '@/core/components/pages/SignUpPage/SignUpPage';
import UnauthorizedPage from '@/core/components/pages/UnauthorizedPage/UnauthorizedPage';
import SsoCallbackPage from '@/core/components/pages/SsoCallbackPage/SsoCallbackPage';
import DashboardPage from '@/features/dashboard/components/pages/DashboardPage/DashboardPage';
import ShowsPage from '@/features/shows/components/pages/ShowsPage/ShowsPage';
import ShowDetailPage from '@/features/shows/components/pages/ShowDetailPage/ShowDetailPage';
import ShowCreatePage from '@/features/shows/components/pages/ShowCreatePage/ShowCreatePage';
import SeasonPage from '@/features/shows/components/pages/SeasonPage/SeasonPage';
import SeasonSettingsTab from '@/features/shows/components/pages/SeasonSettingsTab/SeasonSettingsTab';
import SeasonJobsTab from '@/features/shows/components/pages/SeasonJobsTab/SeasonJobsTab';
import SeasonChatTab from '@/features/shows/components/pages/SeasonChatTab/SeasonChatTab';
import EpisodePage from '@/features/episodes/components/pages/EpisodePage/EpisodePage';
import SummaryTablePage from '@/features/shows/components/pages/SummaryTablePage/SummaryTablePage';
import JobDetailPage from '@/features/processing/components/pages/JobDetailPage/JobDetailPage';
import UsersPage from '@/features/admin/components/pages/UsersPage/UsersPage';
import OrganizationsPage from '@/features/admin/components/pages/OrganizationsPage/OrganizationsPage';
import AuditLogsPage from '@/features/admin/components/pages/AuditLogsPage/AuditLogsPage';
import SessionsPage from '@/features/admin/components/pages/SessionsPage/SessionsPage';
import ApiKeysPage from '@/features/admin/components/pages/ApiKeysPage/ApiKeysPage';
import { ROUTES } from '@/core/constants/routes';
import ToastProvider from '@/core/contexts/ToastContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  if (!getToken()) return <Navigate to={ROUTES.LOGIN} replace />;
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
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.SSO_CALLBACK} element={<SsoCallbackPage />} />
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
