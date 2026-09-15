import { Grid, CircularProgress, Box } from '@mui/material';
import { Plus, MonitorPlay } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import ShowCard from '@/features/shows/components/organisms/ShowCard/ShowCard';
import EmptyState from '@/core/components/atoms/EmptyState/EmptyState';
import { useShows } from '@/features/shows/services/shows';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { ROUTES } from '@/core/constants/routes';
import type { Show } from '@/core/types';
import styles from './ShowsPage.module.css';

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
        <Box className={styles.loading}><CircularProgress /></Box>
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
