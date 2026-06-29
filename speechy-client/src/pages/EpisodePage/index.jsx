import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, CircularProgress, Breadcrumbs } from '@mui/material';
import PageLayout from '../../templates/PageLayout';
import SidebarNav from '../../organisms/SidebarNav';
import StatusBadge from '../../atoms/StatusBadge';
import { useEpisode } from '../../api/episodes';
import { buildRoute } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';
import OverviewTab from './tabs/OverviewTab';
import TranslateTab from './tabs/TranslateTab';
import SummaryTab from './tabs/SummaryTab';
import ContextualTab from './tabs/ContextualTab';
import FilesTab from './tabs/FilesTab';
import SettingsTab from './tabs/SettingsTab';

const TAB_COMPONENTS = {
  overview: OverviewTab,
  translate: TranslateTab,
  summary: SummaryTab,
  contextual: ContextualTab,
  files: FilesTab,
  settings: SettingsTab,
};

export default function EpisodePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: episode, isLoading } = useEpisode(id);

  usePageTitle(episode?.title);

  if (isLoading) {
    return <PageLayout><Box sx={{ pt: 8, textAlign: 'center' }}><CircularProgress /></Box></PageLayout>;
  }

  const TabComponent = TAB_COMPONENTS[activeTab];
  const lastJob = null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 50, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 5 }, py: 1.5 }}>
          <Breadcrumbs>
            <Link to="/dashboard" style={{ color: '#9aa1ae', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>Dashboard</Link>
            <Link to={buildRoute.show(episode?.primary_show)} style={{ color: '#5f6675', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
              {episode?.primary_show_name}
            </Link>
            <Typography fontSize={13} fontWeight={700} color="text.primary">
              {episode?.episode_number} · {episode?.title}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 5 }, py: 3, pb: 8 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ width: 236, flexShrink: 0, position: 'sticky', top: 80 }}>
            <Card sx={{ mb: 1.5 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 700 }}>
                  {episode?.episode_number}
                </Typography>
                <Typography fontWeight={700} fontSize="1rem" mt={0.5} mb={1} lineHeight={1.3}>
                  {episode?.title}
                </Typography>
                <StatusBadge status={episode?.has_translation_en ? 'completed' : 'pending'} />
              </CardContent>
            </Card>
            <SidebarNav active={activeTab} onChange={setActiveTab} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {TabComponent && <TabComponent episode={episode} onTabChange={setActiveTab} />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
