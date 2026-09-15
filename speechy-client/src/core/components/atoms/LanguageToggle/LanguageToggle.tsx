import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import type { Language } from '@/core/types';
import styles from './LanguageToggle.module.css';

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
      className={styles.group}
    >
      <ToggleButton value="en">English</ToggleButton>
      <ToggleButton value="he">עברית</ToggleButton>
    </ToggleButtonGroup>
  );
}
