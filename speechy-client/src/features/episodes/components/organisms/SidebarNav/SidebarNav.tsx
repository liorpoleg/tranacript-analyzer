import { Box, Typography } from '@mui/material';
import { HouseSimple, FileText, Translate, TextAlignLeft, Brain, ChatCircleText, Gear } from '@phosphor-icons/react';
import styles from './SidebarNav.module.css';

interface Tab {
  key: string;
  label: string;
  icon: JSX.Element;
}

const TABS: Tab[] = [
  { key: 'overview',   label: 'Overview',     icon: <HouseSimple size={17} /> },
  { key: 'transcript', label: 'Transcript',   icon: <FileText size={17} /> },
  { key: 'translate',  label: 'Translations', icon: <Translate size={17} /> },
  { key: 'summary',    label: 'Summary',      icon: <TextAlignLeft size={17} /> },
  { key: 'contextual', label: 'Contextual',   icon: <Brain size={17} /> },
  { key: 'chat',       label: 'Chat',         icon: <ChatCircleText size={17} /> },
  { key: 'settings',   label: 'Settings',     icon: <Gear size={17} /> },
];

interface SidebarNavProps {
  active: string;
  onChange: (key: string) => void;
}

export default function SidebarNav({ active, onChange }: SidebarNavProps): JSX.Element {
  return (
    <Box className={styles.root}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Box
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`.trim()}
          >
            <Box className={`${styles.tabIcon} ${isActive ? styles.tabIconActive : ''}`.trim()}>
              {tab.icon}
            </Box>
            <Typography variant="body2" fontWeight={isActive ? 700 : 600} className={styles.tabLabel}>
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
