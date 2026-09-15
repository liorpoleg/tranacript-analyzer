import { Box, Typography } from '@mui/material';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps): JSX.Element {
  return (
    <Box className={styles.root}>
      {icon && <Box className={styles.icon}>{icon}</Box>}
      <Typography variant="h6" fontWeight={700} gutterBottom>{title}</Typography>
      {subtitle && <Typography color="text.secondary" className={styles.subtitle}>{subtitle}</Typography>}
      {action}
    </Box>
  );
}
