import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, CircularProgress, Breadcrumbs, Link as MuiLink } from '@mui/material';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import Navbar from '@/core/components/organisms/Navbar/Navbar';
import SidebarNav from '@/features/episodes/components/organisms/SidebarNav/SidebarNav';
import StatusBadge from '@/core/components/atoms/StatusBadge/StatusBadge';
import { useEpisode } from '@/features/episodes/services/episodes';
import { buildRoute } from '@/core/constants/routes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import OverviewTab from '@/features/episodes/components/organisms/OverviewTab/OverviewTab';
import TranscriptTab from '@/features/episodes/components/organisms/TranscriptTab/TranscriptTab';
import TranslateTab from '@/features/episodes/components/organisms/TranslateTab/TranslateTab';
import SummaryTab from '@/features/episodes/components/organisms/SummaryTab/SummaryTab';
import ContextualTab from '@/features/episodes/components/organisms/ContextualTab/ContextualTab';
import ChatTab from '@/features/episodes/components/organisms/EpisodeChatTab/EpisodeChatTab';
import SettingsTab from '@/features/episodes/components/organisms/EpisodeSettingsTab/EpisodeSettingsTab';
import type { Episode } from '@/core/types';
import styles from './EpisodePage.module.css';

type TabKey = 'overview' | 'transcript' | 'translate' | 'summary' | 'contextual' | 'chat' | 'settings';

interface TabComponentProps {
  episode: Episode;
  onTabChange: (tab: string) => void;
}

const TAB_COMPONENTS: Record<TabKey, React.ComponentType<TabComponentProps>> = {
  overview:   OverviewTab,
  transcript: TranscriptTab,
  translate:  TranslateTab,
  summary:    SummaryTab,
  contextual: ContextualTab,
  chat:       ChatTab,
  settings:   SettingsTab,
};

export default function EpisodePage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const { data: episode, isLoading } = useEpisode(id);

  usePageTitle(episode?.title);

  if (isLoading) {
    return <PageLayout><Box className={styles.loading}><CircularProgress /></Box></PageLayout>;
  }

  const TabComponent = TAB_COMPONENTS[activeTab];
  const ep = episode;

  return (
    <Box className={styles.root}>
      <Navbar />

      <Box className={styles.breadcrumbBar}>
        <Box className={styles.breadcrumbContent}>
          <Breadcrumbs>
            <MuiLink component={Link} to="/dashboard" underline="none" className={styles.breadcrumbDashboardLink}>Dashboard</MuiLink>
            <MuiLink component={Link} to={buildRoute.show(ep?.primary_show ?? '')} underline="none" className={styles.breadcrumbShowLink}>
              {ep?.primary_show_name}
            </MuiLink>
            <Typography fontSize={13} fontWeight={700} color="text.primary">
              {ep?.episode_number} · {ep?.title}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Box>

      <Box className={styles.content}>
        <Box className={styles.layout}>
          <Box className={styles.sidebar}>
            <Card className={styles.metaCard}>
              <CardContent className={styles.metaCardContent}>
                <Typography variant="caption" className={styles.episodeNumber}>
                  {ep?.episode_number}
                </Typography>
                <Typography fontWeight={700} fontSize="1rem" lineHeight={1.3} className={styles.episodeTitle}>
                  {ep?.title}
                </Typography>
                <StatusBadge status={ep?.has_translation_en ? 'completed' : 'pending'} />
              </CardContent>
            </Card>
            <SidebarNav active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />
          </Box>

          <Box className={styles.tabContent}>
            {TabComponent && ep && <TabComponent episode={ep} onTabChange={(tab) => setActiveTab(tab as TabKey)} />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
