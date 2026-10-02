import { Box, Typography } from '@mui/material';
import mascot from '@/assets/brand/mascot-full.png';
import styles from './AuthHeader.module.css';

interface AuthHeaderProps {
  subtitle: string;
}

// The mascot art already spells out "speechy" on its own speech bubble, so
// there's no separate wordmark here — a second "speechy" label underneath
// would just repeat it.
export default function AuthHeader({ subtitle }: AuthHeaderProps): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box component="img" src={mascot} alt="Speechy" className={styles.mascot} />
      <Typography color="text.secondary" variant="body2">{subtitle}</Typography>
    </Box>
  );
}
