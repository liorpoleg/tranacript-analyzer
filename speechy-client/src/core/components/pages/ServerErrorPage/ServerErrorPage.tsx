import { Box, Typography } from '@mui/material';
import { ArrowClockwise, House } from '@phosphor-icons/react';
import AuthLayout from '@/core/components/templates/AuthLayout/AuthLayout';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import { ROUTES } from '@/core/constants/routes';
import mascot from '@/assets/brand/mascot-error.png';
import styles from './ServerErrorPage.module.css';

export default function ServerErrorPage(): JSX.Element {
  return (
    <AuthLayout maxWidth={460}>
      <Box className={styles.content}>
        <Box component="img" src={mascot} alt="" className={styles.mascot} />
        <Typography variant="h2" mb={1}>Something went wrong</Typography>
        <Typography color="text.secondary" className={styles.subtitle}>
          An unexpected error occurred. Try reloading the page — if it keeps happening,
          contact your administrator.
        </Typography>
        <Box className={styles.actions}>
          {/* Full reloads, not react-router navigation — the page tree may be in a broken state. */}
          <AppButton
            variant="outlined"
            startIcon={<ArrowClockwise size={16} weight="bold" />}
            onClick={() => window.location.reload()}
          >
            Reload page
          </AppButton>
          <AppButton
            variant="contained"
            startIcon={<House size={16} weight="fill" />}
            onClick={() => { window.location.href = ROUTES.DASHBOARD; }}
          >
            Go to dashboard
          </AppButton>
        </Box>
      </Box>
    </AuthLayout>
  );
}
