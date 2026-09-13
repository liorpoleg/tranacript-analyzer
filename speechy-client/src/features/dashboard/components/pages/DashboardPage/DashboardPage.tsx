import { Box, Card, CardContent, Typography, Grid, Stack, CircularProgress } from '@mui/material';
import { Plus, BookOpen, ListBullets, Lightning, CheckCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import JobStatusRow from '@/features/processing/components/molecules/JobStatusRow/JobStatusRow';
import StatCard from '@/features/dashboard/components/molecules/StatCard/StatCard';
import ShowListItem from '@/features/dashboard/components/molecules/ShowListItem/ShowListItem';
import { useShows } from '@/features/shows/services/shows';
import { useJobs } from '@/features/processing/services/jobs';
import { useAuth } from '@/core/hooks/useAuth';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { ROUTES } from '@/core/constants/routes';
import type { Show, ProcessingJob } from '@/core/types';
import styles from './DashboardPage.module.css';

export default function DashboardPage(): JSX.Element {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: shows = [], isLoading: showsLoading } = useShows();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();

  const runningJobs = jobs.filter((j: ProcessingJob) => j.status === 'running').length;
  const completedToday = jobs.filter((j: ProcessingJob) => {
    if (j.status !== 'completed') return false;
    const d = new Date(j.completed_at as string);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const totalEpisodes = shows.reduce((s: number, sh: Show) => s + (sh.episode_count ?? 0), 0);
  const recentJobs = [...jobs]
    .sort((a: ProcessingJob, b: ProcessingJob) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <PageLayout>
      <SectionHeader
        title={`${greeting}, ${user?.username ?? ''}!`}
        subtitle="Here's what's happening across your shows."
        action={
          <AppButton variant="contained" startIcon={<Plus size={16} weight="bold" />} onClick={() => navigate(ROUTES.SHOW_NEW)}>
            New Show
          </AppButton>
        }
      />

      <Grid container spacing={2} className={styles.statsGrid}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Shows" value={shows.length} icon={<BookOpen size={17} weight="fill" />} accent="#2196f3" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Episodes" value={totalEpisodes} icon={<ListBullets size={17} weight="bold" />} accent="#0288d1" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Running" value={runningJobs} icon={<Lightning size={17} weight="fill" />} accent="#f59e0b" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Done Today" value={completedToday} icon={<CheckCircle size={17} weight="fill" />} accent="#22c55e" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent className={styles.cardContent}>
              <Box className={styles.cardHeader}>
                <Typography fontWeight={700} className={styles.cardTitle}>Your Shows</Typography>
                <AppButton size="small" onClick={() => navigate(ROUTES.SHOWS)}>View all</AppButton>
              </Box>
              <Box className={styles.cardDivider} />

              {showsLoading ? (
                <Box className={styles.centeredState}><CircularProgress size={28} /></Box>
              ) : shows.length === 0 ? (
                <Box className={styles.centeredState}>
                  <Typography color="text.secondary" variant="body2">No shows yet.</Typography>
                  <AppButton
                    variant="contained"
                    size="small"
                    className={styles.emptyAction}
                    onClick={() => navigate(ROUTES.SHOW_NEW)}
                  >
                    Create your first show
                  </AppButton>
                </Box>
              ) : (
                <Grid container spacing={1.5} className={styles.showsGrid}>
                  {shows.slice(0, 6).map((show: Show) => (
                    <Grid item xs={12} sm={6} key={show.id}>
                      <ShowListItem show={show} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={styles.fullHeightCard}>
            <CardContent className={styles.cardContent}>
              <Box className={styles.cardHeader}>
                <Typography fontWeight={700} className={styles.cardTitle}>Recent Activity</Typography>
              </Box>
              <Box className={styles.cardDivider} />
              {jobsLoading ? (
                <Box className={styles.smallCenteredState}><CircularProgress size={24} /></Box>
              ) : (
                <Stack>
                  {recentJobs.map((job: ProcessingJob) => <JobStatusRow key={job.id} job={job} />)}
                  {recentJobs.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" className={styles.noActivity}>
                      No activity yet.
                    </Typography>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageLayout>
  );
}
