import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { Gear, Stack, ChatCircleText } from '@phosphor-icons/react';
import { buildRoute } from '../constants/routes';

type SeasonTab = 'settings' | 'jobs' | 'chat';

interface SeasonTabBarProps {
  seasonId: string;
  active: SeasonTab;
}

const TABS: { key: SeasonTab; label: string; icon: React.ReactNode; href: (id: string) => string }[] = [
  { key: 'settings', label: 'Settings', icon: <Gear size={15} />,          href: buildRoute.season },
  { key: 'jobs',     label: 'Jobs',     icon: <Stack size={15} />,          href: buildRoute.seasonJobs },
  { key: 'chat',     label: 'Chat',     icon: <ChatCircleText size={15} />, href: buildRoute.seasonChat },
];

export default function SeasonTabBar({ seasonId, active }: SeasonTabBarProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Button
            key={tab.key}
            size="small"
            startIcon={tab.icon}
            onClick={() => navigate(tab.href(seasonId))}
            sx={{
              borderRadius: 2.5,
              px: 2,
              py: 0.75,
              fontWeight: isActive ? 700 : 500,
              bgcolor: isActive ? '#e3f2fd' : 'transparent',
              color: isActive ? 'primary.main' : 'text.secondary',
              '&:hover': {
                bgcolor: isActive ? '#e3f2fd' : 'rgba(0,0,0,0.04)',
                color: isActive ? 'primary.main' : 'text.primary',
              },
            }}
          >
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
}
