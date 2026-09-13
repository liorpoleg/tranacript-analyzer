import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import styles from './SsoCallbackPage.module.css';

export default function SsoCallbackPage(): JSX.Element {
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token && window.opener) {
      window.opener.postMessage({ token }, window.location.origin);
    }
    window.close();
  }, []);

  return (
    <Box className={styles.root}>
      <CircularProgress size={32} />
      <Typography color="text.secondary">Completing sign in…</Typography>
    </Box>
  );
}
