import { Box } from '@mui/material';
import styles from './TwoColumnLayout.module.css';

interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
}

export default function TwoColumnLayout({ left, right, leftWidth = '45%' }: TwoColumnLayoutProps): JSX.Element {
  return (
    <Box className={styles.grid} style={{ '--left-width': leftWidth } as React.CSSProperties}>
      <Box>{left}</Box>
      <Box>{right}</Box>
    </Box>
  );
}
