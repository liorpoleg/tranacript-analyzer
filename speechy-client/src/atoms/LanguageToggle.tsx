import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import type { Language } from '../types';

interface LanguageToggleProps {
  value: Language;
  onChange: (value: Language) => void;
}

export default function LanguageToggle({ value, onChange }: LanguageToggleProps): JSX.Element {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v: Language | null) => v && onChange(v)}
      size="small"
      sx={{ '& .MuiToggleButton-root': { px: 2, fontWeight: 700, borderRadius: '8px !important' } }}
    >
      <ToggleButton value="en">English</ToggleButton>
      <ToggleButton value="he">עברית</ToggleButton>
    </ToggleButtonGroup>
  );
}
