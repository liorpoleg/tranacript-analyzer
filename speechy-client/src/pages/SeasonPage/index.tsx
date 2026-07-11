import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
import { ArrowLeft } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import SeasonTabBar from '../../molecules/SeasonTabBar';
import { useSeason } from '../../api/shows';
import { usePageTitle } from '../../hooks/usePageTitle';

type SeasonTab = 'settings' | 'jobs' | 'chat';

function resolveTab(pathname: string): SeasonTab {
  if (pathname.endsWith('/jobs')) return 'jobs';
  if (pathname.endsWith('/chat')) return 'chat';
  return 'settings';
}

export default function SeasonPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data: season } = useSeason(id);
  const title = season ? `Season ${season.number}${season.title ? ` — ${season.title}` : ''}` : 'Season';

  usePageTitle(title);

  return (
    <PageLayout>
      <Button
        startIcon={<ArrowLeft size={16} />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back
      </Button>

      <Typography variant="h2" mb={2}>{title}</Typography>
      <SeasonTabBar seasonId={id!} active={resolveTab(pathname)} />

      <Outlet />
    </PageLayout>
  );
}
