import { Box } from '@mui/material';
import AppShell from '@/core/components/templates/AppShell/AppShell';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import styles from './TablePageLayout.module.css';

interface TablePageLayoutProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number | string;
}

export default function TablePageLayout({ title, subtitle, action, filterBar, children, maxWidth = 1280 }: TablePageLayoutProps): JSX.Element {
  const resolvedMaxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  return (
    <AppShell>
      <Box className={styles.content} style={{ '--page-max-width': resolvedMaxWidth } as React.CSSProperties}>
        <SectionHeader title={title} subtitle={subtitle} action={action} />
        {filterBar && <Box className={styles.filterBar}>{filterBar}</Box>}
        {children}
      </Box>
    </AppShell>
  );
}
