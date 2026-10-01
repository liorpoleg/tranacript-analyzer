import { Card, CardContent, Box, Typography } from '@mui/material';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
}

export default function StatCard({ label, value, icon, accent = '#2F6277' }: StatCardProps): JSX.Element {
  const bgAlpha = `${accent}18`;

  return (
    <Card>
      <CardContent className={styles.cardContent}>
        <Box className={styles.header}>
          <Typography variant="body2" fontWeight={600} color="text.secondary" className={styles.label}>
            {label}
          </Typography>
          {icon && (
            <Box className={styles.iconWrap} style={{ '--stat-bg': bgAlpha, '--stat-accent': accent } as React.CSSProperties}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography className={styles.value}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
