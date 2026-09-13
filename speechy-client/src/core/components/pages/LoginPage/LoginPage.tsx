import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Typography, Alert, Link as MuiLink, Divider } from '@mui/material';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AuthLayout from '@/core/components/templates/AuthLayout/AuthLayout';
import AuthHeader from '@/core/components/molecules/AuthHeader/AuthHeader';
import { useLogin, loginWithSSO } from '@/core/services/auth';
import { ROUTES } from '@/core/constants/routes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import styles from './LoginPage.module.css';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage(): JSX.Element {
  usePageTitle('Login');
  const navigate = useNavigate();
  const login = useLogin();
  const [form, setForm] = useState<LoginForm>({ username: '', password: '' });
  const [error, setError] = useState<string>('');
  const [ssoLoading, setSsoLoading] = useState(false);
  const cancelSsoRef = useRef<(() => void) | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    try {
      await login.mutateAsync(form);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      setError('Invalid username or password.');
    }
  };

  const handleSSOLogin = (): void => {
    setError('');
    setSsoLoading(true);
    const cancel = loginWithSSO(navigate, (msg) => {
      setSsoLoading(false);
      cancelSsoRef.current = null;
      setError(msg);
    });
    cancelSsoRef.current = cancel;
  };

  const handleCancelSSO = (): void => {
    cancelSsoRef.current?.();
    cancelSsoRef.current = null;
    setSsoLoading(false);
  };

  return (
    <AuthLayout maxWidth={420}>
      <AuthHeader subtitle="Sign in to your workspace" />

      {error && <Alert severity="error" className={styles.errorAlert}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} className={styles.form}>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Username</Typography>
          <TextField
            fullWidth size="small" autoFocus
            value={form.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, username: e.target.value }))}
          />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Password</Typography>
          <TextField
            fullWidth size="small" type="password"
            value={form.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </Box>
        <AppButton type="submit" variant="contained" size="large" fullWidth loading={login.isLoading} className={styles.submitButton}>
          Sign In
        </AppButton>
      </Box>

      <Divider className={styles.divider}>
        <Typography variant="caption" color="text.disabled">or</Typography>
      </Divider>

      {ssoLoading ? (
        <Box className={styles.ssoRow}>
          <AppButton variant="outlined" fullWidth loading>
            Waiting for SSO…
          </AppButton>
          <AppButton variant="text" color="inherit" onClick={handleCancelSSO} className={styles.cancelButton}>
            Cancel
          </AppButton>
        </Box>
      ) : (
        <AppButton variant="outlined" fullWidth onClick={handleSSOLogin}>
          Login with SSO
        </AppButton>
      )}

      <Typography variant="body2" color="text.secondary" textAlign="center" className={styles.signupPrompt}>
        Don't have an account?{' '}
        <MuiLink component={Link} to={ROUTES.SIGNUP} underline="none" className={styles.signupLink}>
          Sign up
        </MuiLink>
      </Typography>
    </AuthLayout>
  );
}
