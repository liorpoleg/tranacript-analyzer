import { Box, Button } from '@mui/material';
import { HouseSimple, Translate, TextAlignLeft, ChatText, Folder, Gear, Brain } from '@phosphor-icons/react';

interface Tab {
  key: string;
  label: string;
  icon: JSX.Element;
}

const TABS: Tab[] = [
  { key: 'overview', label: 'Overview', icon: <HouseSimple size={18} /> },
  { key: 'translate', label: 'Translate', icon: <Translate size={18} /> },
  { key: 'summary', label: 'Summary', icon: <TextAlignLeft size={18} /> },
  { key: 'contextual', label: 'Contextual', icon: <Brain size={18} /> },
  { key: 'files', label: 'Files', icon: <Folder size={18} /> },
  { key: 'settings', label: 'Settings', icon: <Gear size={18} /> },
];

interface SidebarNavProps {
  active: string;
  onChange: (key: string) => void;
}

export default function SidebarNav({ active, onChange }: SidebarNavProps): JSX.Element {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {TABS.map((tab) => (
        <Button
          key={tab.key}
          startIcon={tab.icon}
          onClick={() => onChange(tab.key)}
          sx={{
            justifyContent: 'flex-start',
            px: 1.75,
            py: 1.25,
            borderRadius: 2,
            fontWeight: active === tab.key ? 700 : 600,
            color: active === tab.key ? 'primary.main' : 'text.secondary',
            bgcolor: active === tab.key ? 'primary.50' : 'transparent',
            '&:hover': { bgcolor: active === tab.key ? 'primary.50' : 'background.default' },
          }}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );
}
