import { Box } from '@mui/material';
import AppShell from '@/core/components/templates/AppShell/AppShell';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function PageLayout({ children, maxWidth = 1260 }: PageLayoutProps): JSX.Element {
  return (
    <AppShell>
      <Box className={styles.content} style={{ '--page-max-width': `${maxWidth}px` } as React.CSSProperties}>
        {children}
      </Box>
    </AppShell>
  );
}
