import { Grid, CircularProgress, Box } from '@mui/material';
import { Plus, MonitorPlay } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../templates/PageLayout';
import SectionHeader from '../../atoms/SectionHeader';
import AppButton from '../../atoms/AppButton';
import ShowCard from '../../organisms/ShowCard';
import EmptyState from '../../atoms/EmptyState';
import { useShows } from '../../api/shows';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ROUTES } from '../../constants/routes';
import type { Show } from '../../types';

export default function ShowsPage(): JSX.Element {
  usePageTitle('TV Shows');
  const navigate = useNavigate();
  const { data: shows = [], isLoading } = useShows();

  return (
    <PageLayout>
      <SectionHeader
        title="TV Shows"
        subtitle="Every series in your workspace."
        action={
          <AppButton variant="contained" startIcon={<Plus size={17} />} onClick={() => navigate(ROUTES.SHOW_NEW)}>
            New TV Show
          </AppButton>
        }
      />
      {isLoading ? (
        <Box sx={{ textAlign: 'center', pt: 8 }}><CircularProgress /></Box>
      ) : shows.length === 0 ? (
        <EmptyState
          icon={<MonitorPlay size={48} />}
          title="No shows yet"
          subtitle="Create your first TV show to get started."
          action={<AppButton variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate(ROUTES.SHOW_NEW)}>New TV Show</AppButton>}
        />
      ) : (
        <Grid container spacing={2.5}>
          {shows.map((show: Show) => (
            <Grid item xs={12} sm={6} md={4} key={show.id}>
              <ShowCard show={show} />
            </Grid>
          ))}
        </Grid>
      )}
    </PageLayout>
  );
}
