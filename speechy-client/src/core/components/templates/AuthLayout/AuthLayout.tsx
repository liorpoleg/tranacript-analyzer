import { Box, Card, CardContent } from '@mui/material';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function AuthLayout({ children, maxWidth = 420 }: AuthLayoutProps): JSX.Element {
  return (
    <Box className={styles.root}>
      <Card className={styles.card} style={{ '--auth-card-max-width': `${maxWidth}px` } as React.CSSProperties}>
        <CardContent className={styles.content}>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
