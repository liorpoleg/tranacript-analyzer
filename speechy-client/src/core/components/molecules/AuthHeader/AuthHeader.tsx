import { Box, Typography } from '@mui/material';
import SpeechyLogo from '@/core/components/atoms/SpeechyLogo/SpeechyLogo';
import styles from './AuthHeader.module.css';

interface AuthHeaderProps {
  subtitle: string;
}

export default function AuthHeader({ subtitle }: AuthHeaderProps): JSX.Element {
  return (
    <Box className={styles.root}>
      <SpeechyLogo />
      <Typography className={styles.title}>Speechy</Typography>
      <Typography color="text.secondary" variant="body2">{subtitle}</Typography>
    </Box>
  );
}
