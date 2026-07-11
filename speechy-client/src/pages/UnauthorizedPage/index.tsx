import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography } from '@mui/material';
import AppButton from '../../atoms/AppButton';
import { removeToken } from '../../utils/tokenStorage';
import { ROUTES } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function UnauthorizedPage(): JSX.Element {
  usePageTitle('Unauthorized');
  const navigate = useNavigate();

  const handleBack = (): void => {
    removeToken();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <CardContent sx={{ p: 5 }}>
          <Typography variant="h2" mb={2}>Access Denied</Typography>
          <Typography color="text.secondary" mb={4}>
            You don't have permission to access Speechy. Contact your administrator.
          </Typography>
          <AppButton variant="contained" onClick={handleBack}>
            Back to Login
          </AppButton>
        </CardContent>
      </Card>
    </Box>
  );
}
