import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { Gear, Stack, ChatCircleText } from '@phosphor-icons/react';
import { buildRoute } from '@/core/constants/routes';
import styles from './SeasonTabBar.module.css';

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
    <Box className={styles.root}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Button
            key={tab.key}
            size="small"
            startIcon={tab.icon}
            onClick={() => navigate(tab.href(seasonId))}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`.trim()}
          >
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
}
