import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, CircularProgress, Breadcrumbs, Link as MuiLink } from '@mui/material';
import PageLayout from '../../templates/PageLayout';
import Navbar from '../../organisms/Navbar';
import SidebarNav from '../../organisms/SidebarNav';
import StatusBadge from '../../atoms/StatusBadge';
import { useEpisode } from '../../api/episodes';
import { buildRoute } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';
import OverviewTab from './tabs/OverviewTab';
import TranscriptTab from './tabs/TranscriptTab';
import TranslateTab from './tabs/TranslateTab';
import SummaryTab from './tabs/SummaryTab';
import ContextualTab from './tabs/ContextualTab';
import ChatTab from './tabs/ChatTab';
import SettingsTab from './tabs/SettingsTab';
import type { Episode } from '../../types';

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
    return <PageLayout><Box sx={{ pt: 8, textAlign: 'center' }}><CircularProgress /></Box></PageLayout>;
  }

  const TabComponent = TAB_COMPONENTS[activeTab];
  const ep = episode;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />

      <Box sx={{ position: 'sticky', top: 60, zIndex: 40, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 5 }, py: 1.5 }}>
          <Breadcrumbs>
            <MuiLink component={Link} to="/dashboard" underline="none" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: 13 }}>Dashboard</MuiLink>
            <MuiLink component={Link} to={buildRoute.show(ep?.primary_show ?? '')} underline="none" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 13 }}>
              {ep?.primary_show_name}
            </MuiLink>
            <Typography fontSize={13} fontWeight={700} color="text.primary">
              {ep?.episode_number} · {ep?.title}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 5 }, py: 3, pb: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{
            width: { xs: '100%', md: 236 },
            flexShrink: 0,
            position: { xs: 'static', md: 'sticky' },
            top: 116,
          }}
          >
            <Card sx={{ mb: 1.5 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 700 }}>
                  {ep?.episode_number}
                </Typography>
                <Typography fontWeight={700} fontSize="1rem" mt={0.5} mb={1} lineHeight={1.3}>
                  {ep?.title}
                </Typography>
                <StatusBadge status={ep?.has_translation_en ? 'completed' : 'pending'} />
              </CardContent>
            </Card>
            <SidebarNav active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {TabComponent && ep && <TabComponent episode={ep} onTabChange={(tab) => setActiveTab(tab as TabKey)} />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
