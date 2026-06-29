import { Box, Card, CardContent, Typography, Grid, Stack, CircularProgress } from '@mui/material';
import { Plus, MonitorPlay, FilmSlate, Lightning, CheckCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../templates/PageLayout';
import SectionHeader from '../../atoms/SectionHeader';
import AppButton from '../../atoms/AppButton';
import ShowCard from '../../organisms/ShowCard';
import JobStatusRow from '../../molecules/JobStatusRow';
import StatCard from '../../molecules/StatCard';
import { useShows } from '../../api/shows';
import { useJobs } from '../../api/jobs';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ROUTES, buildRoute } from '../../constants/routes';

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: shows = [], isLoading: showsLoading } = useShows();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();

  const runningJobs = jobs.filter((j) => j.status === 'running').length;
  const completedToday = jobs.filter((j) => {
    if (j.status !== 'completed') return false;
    const d = new Date(j.completed_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const recentJobs = [...jobs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  return (
    <PageLayout>
      <SectionHeader
        title={`Good day, ${user?.username ?? ''}!`}
        subtitle="Here's what's moving across your shows."
        action={
          <AppButton variant="contained" startIcon={<Plus size={17} />} onClick={() => navigate(ROUTES.SHOW_NEW)}>
            New TV Show
          </AppButton>
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="TV Shows" value={shows.length} icon={<MonitorPlay size={17} />} /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Total Episodes" value={shows.reduce((s, sh) => s + (sh.episode_count ?? 0), 0)} icon={<FilmSlate size={17} />} /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Running Jobs" value={runningJobs} icon={<Lightning size={17} />} /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Completed Today" value={completedToday} icon={<CheckCircle size={17} />} /></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                <Typography fontWeight={700}>Your TV Shows</Typography>
                <AppButton size="small" onClick={() => navigate(ROUTES.SHOWS)}>View all</AppButton>
              </Box>
              {showsLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
              ) : (
                <Grid container spacing={1.5} sx={{ p: 1 }}>
                  {shows.slice(0, 6).map((show) => (
                    <Grid item xs={12} sm={6} key={show.id}>
                      <Box
                        onClick={() => navigate(buildRoute.show(show.id))}
                        sx={{
                          display: 'flex', gap: 1.5, p: 1.5, borderRadius: 2,
                          border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' },
                          transition: 'transform 0.12s, box-shadow 0.12s',
                        }}
                      >
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                          {show.name.slice(0, 2).toUpperCase()}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700} noWrap>{show.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{show.episode_count} episodes</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 1 }}>
              <Typography fontWeight={700} sx={{ px: 2, pt: 1.5, pb: 1 }}>Recent Activity</Typography>
              {jobsLoading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>
              ) : (
                <Stack>
                  {recentJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
                  {recentJobs.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>No jobs yet.</Typography>
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
