import { Box, Typography } from '@mui/material';
import { HouseSimple, FileText, Translate, TextAlignLeft, Brain, ChatCircleText, Gear } from '@phosphor-icons/react';

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
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'row', md: 'column' },
      gap: 0.25,
      overflowX: { xs: 'auto', md: 'visible' },
    }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Box
            key={tab.key}
            onClick={() => onChange(tab.key)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 1.1,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              borderRadius: 2.5,
              cursor: 'pointer',
              bgcolor: isActive ? '#e3f2fd' : 'transparent',
              color: isActive ? 'primary.main' : 'text.secondary',
              transition: 'background 0.12s ease, color 0.12s ease',
              '&:hover': {
                bgcolor: isActive ? '#e3f2fd' : 'rgba(0,0,0,0.04)',
                color: isActive ? 'primary.main' : 'text.primary',
              },
              userSelect: 'none',
            }}
          >
            <Box sx={{ display: 'flex', flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>
              {tab.icon}
            </Box>
            <Typography
              variant="body2"
              fontWeight={isActive ? 700 : 600}
              sx={{ lineHeight: 1 }}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
