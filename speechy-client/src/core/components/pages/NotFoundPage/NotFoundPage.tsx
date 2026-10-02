import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, House } from '@phosphor-icons/react';
import AuthLayout from '@/core/components/templates/AuthLayout/AuthLayout';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { ROUTES } from '@/core/constants/routes';
import mascot from '@/assets/brand/mascot-404.png';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage(): JSX.Element {
  usePageTitle('Page not found');
  const navigate = useNavigate();

  return (
    <AuthLayout maxWidth={460}>
      <Box className={styles.content}>
        <Box component="img" src={mascot} alt="" className={styles.mascot} />
        <Typography variant="h2" mb={1}>Oops, page not found</Typography>
        <Typography color="text.secondary" className={styles.subtitle}>
          The page you're looking for doesn't exist or may have moved.
        </Typography>
        <Box className={styles.actions}>
          <AppButton variant="outlined" startIcon={<ArrowLeft size={16} weight="bold" />} onClick={() => navigate(-1)}>
            Go back
          </AppButton>
          <AppButton variant="contained" startIcon={<House size={16} weight="fill" />} onClick={() => navigate(ROUTES.DASHBOARD)}>
            Go to dashboard
          </AppButton>
        </Box>
      </Box>
    </AuthLayout>
  );
}
