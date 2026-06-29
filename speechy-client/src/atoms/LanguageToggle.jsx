import { ToggleButtonGroup, ToggleButton } from '@mui/material';

export default function LanguageToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      size="small"
      sx={{ '& .MuiToggleButton-root': { px: 2, fontWeight: 700, borderRadius: '8px !important' } }}
    >
      <ToggleButton value="en">English</ToggleButton>
      <ToggleButton value="he">עברית</ToggleButton>
    </ToggleButtonGroup>
  );
}
