import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AuthLayout from '@/core/components/templates/AuthLayout/AuthLayout';
import { removeToken } from '@/core/utils/tokenStorage';
import { ROUTES } from '@/core/constants/routes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import styles from './UnauthorizedPage.module.css';

export default function UnauthorizedPage(): JSX.Element {
  usePageTitle('Unauthorized');
  const navigate = useNavigate();

  const handleBack = (): void => {
    removeToken();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <AuthLayout maxWidth={420}>
      <Box className={styles.content}>
        <Typography variant="h2" mb={2}>Access Denied</Typography>
        <Typography color="text.secondary" className={styles.subtitle}>
          You don't have permission to access Speechy. Contact your administrator.
        </Typography>
        <AppButton variant="contained" onClick={handleBack}>
          Back to Login
        </AppButton>
      </Box>
    </AuthLayout>
  );
}
