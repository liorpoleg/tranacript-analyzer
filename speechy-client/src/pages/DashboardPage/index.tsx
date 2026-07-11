import { Box, Card, CardContent, Typography, Grid, Stack, CircularProgress } from '@mui/material';
import { Plus, BookOpen, ListBullets, Lightning, CheckCircle } from '@phosphor-icons/react';
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
import type { Show, ProcessingJob } from '../../types';

const SHOW_AVATARS = ['#2196f3', '#0288d1', '#0277bd', '#01579b', '#006db3', '#4fc3f7'];
function getAvatarColor(name = '') { return SHOW_AVATARS[name.charCodeAt(0) % SHOW_AVATARS.length]; }

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

      <Grid container spacing={2} mb={3.5}>
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
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}>
                <Typography fontWeight={700} fontSize="0.95rem">Your Shows</Typography>
                <AppButton size="small" onClick={() => navigate(ROUTES.SHOWS)}>View all</AppButton>
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />

              {showsLoading ? (
                <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={28} /></Box>
              ) : shows.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No shows yet.</Typography>
                  <AppButton
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate(ROUTES.SHOW_NEW)}
                  >
                    Create your first show
                  </AppButton>
                </Box>
              ) : (
                <Grid container spacing={1.5} sx={{ p: 2 }}>
                  {shows.slice(0, 6).map((show: Show) => (
                    <Grid item xs={12} sm={6} key={show.id}>
                      <Box
                        onClick={() => navigate(buildRoute.show(show.id))}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                          '&:hover': {
                            borderColor: 'primary.light',
                            bgcolor: '#e3f2fd',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: 2,
                            bgcolor: getAvatarColor(show.name),
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem',
                            flexShrink: 0, letterSpacing: '-0.02em',
                          }}
                        >
                          {show.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700} fontSize="0.875rem" noWrap>{show.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {show.episode_count ?? 0} episodes
                          </Typography>
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
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography fontWeight={700} fontSize="0.95rem">Recent Activity</Typography>
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
              {jobsLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
              ) : (
                <Stack>
                  {recentJobs.map((job: ProcessingJob) => <JobStatusRow key={job.id} job={job} />)}
                  {recentJobs.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
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
