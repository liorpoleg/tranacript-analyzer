import { useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, InputBase } from '@mui/material';
import { Plus, BookOpen, ListBullets, MagnifyingGlass } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import StatCard from '@/features/dashboard/components/molecules/StatCard/StatCard';
import ShowListItem from '@/features/dashboard/components/molecules/ShowListItem/ShowListItem';
import { useShows } from '@/features/shows/services/shows';
import { useAuth } from '@/core/hooks/useAuth';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { ROUTES } from '@/core/constants/routes';
import type { Show } from '@/core/types';
import styles from './DashboardPage.module.css';

export default function DashboardPage(): JSX.Element {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: shows = [], isLoading: showsLoading } = useShows();
  const [query, setQuery] = useState('');

  const totalEpisodes = shows.reduce((s: number, sh: Show) => s + (sh.episode_count ?? 0), 0);

  const visibleShows = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const filtered = trimmed
      ? shows.filter((sh: Show) => sh.name.toLowerCase().includes(trimmed))
      : shows;
    return trimmed ? filtered : filtered.slice(0, 8);
  }, [shows, query]);

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

      <Box className={styles.statsRow}>
        <StatCard label="Shows" value={shows.length} icon={<BookOpen size={17} weight="fill" />} accent="#2F6277" />
        <StatCard label="Episodes" value={totalEpisodes} icon={<ListBullets size={17} weight="bold" />} accent="#5FC9CC" />
      </Box>

      <Card>
        <CardContent className={styles.cardContent}>
          <Box className={styles.cardHeader}>
            <Typography fontWeight={700} className={styles.cardTitle}>Your Shows</Typography>
            <Box className={styles.cardHeaderActions}>
              <Box className={styles.searchBar}>
                <MagnifyingGlass size={15} color="#9BB0B4" style={{ flexShrink: 0 }} />
                <InputBase
                  size="small"
                  placeholder="Search shows…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </Box>
              <AppButton size="small" onClick={() => navigate(ROUTES.SHOWS)}>View all</AppButton>
            </Box>
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
          ) : visibleShows.length === 0 ? (
            <Box className={styles.centeredState}>
              <Typography color="text.secondary" variant="body2">No shows match "{query}".</Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5} className={styles.showsGrid}>
              {visibleShows.map((show: Show) => (
                <Grid item xs={12} sm={6} md={4} key={show.id}>
                  <ShowListItem show={show} />
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
