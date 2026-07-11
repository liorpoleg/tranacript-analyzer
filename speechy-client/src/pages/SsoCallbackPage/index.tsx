import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <CircularProgress size={32} />
      <Typography color="text.secondary">Completing sign in…</Typography>
    </Box>
  );
}
