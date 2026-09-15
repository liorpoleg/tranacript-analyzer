import { Box } from '@mui/material';
import Navbar from '@/core/components/organisms/Navbar/Navbar';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function PageLayout({ children, maxWidth = 1260 }: PageLayoutProps): JSX.Element {
  return (
    <Box className={styles.root}>
      <Navbar />
      <Box className={styles.content} style={{ '--page-max-width': `${maxWidth}px` } as React.CSSProperties}>
        {children}
      </Box>
    </Box>
  );
}
