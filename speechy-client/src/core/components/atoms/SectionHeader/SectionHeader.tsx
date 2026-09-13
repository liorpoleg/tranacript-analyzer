import { Box, Typography } from '@mui/material';
import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps): JSX.Element {
  return (
    <Box className={styles.header}>
      <Box>
        <Typography variant="h2" className={styles.title}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" className={styles.subtitle}>{subtitle}</Typography>}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
