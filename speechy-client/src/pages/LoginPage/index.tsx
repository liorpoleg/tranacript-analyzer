import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, Divider, TextField, Typography, Alert } from '@mui/material';
import AppButton from '../../atoms/AppButton';
import { useLogin, loginWithSSO } from '../../api/auth';
import { ROUTES } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';

function SpeechyLogo(): JSX.Element {
  return (
    <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
      <rect x="3" y="4" width="26" height="20" rx="9" fill="#2196f3" />
      <path d="M10.5 24 L10.5 29 L17.5 24 Z" fill="#2196f3" />
      <circle cx="12.4" cy="13" r="2.15" fill="#fff" />
      <circle cx="19.6" cy="13" r="2.15" fill="#fff" />
      <path d="M12 17.4 Q16 20.6 20 17.4" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" fill="none" />
    </svg>
  );
}

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SpeechyLogo />
            <Typography sx={{ fontFamily: '"Baloo 2"', fontWeight: 800, fontSize: '1.8rem', mt: 1 }}>Speechy</Typography>
            <Typography color="text.secondary" variant="body2">Sign in to your workspace</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            <AppButton type="submit" variant="contained" size="large" fullWidth loading={login.isLoading} sx={{ mt: 1 }}>
              Sign In
            </AppButton>
          </Box>

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.disabled">or</Typography>
          </Divider>

          {ssoLoading ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <AppButton variant="outlined" fullWidth loading>
                Waiting for SSO…
              </AppButton>
              <AppButton variant="text" color="inherit" onClick={handleCancelSSO} sx={{ flexShrink: 0 }}>
                Cancel
              </AppButton>
            </Box>
          ) : (
            <AppButton variant="outlined" fullWidth onClick={handleSSOLogin}>
              Login with SSO
            </AppButton>
          )}

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2.5}>
            Don't have an account?{' '}
            <Link to={ROUTES.SIGNUP} style={{ color: '#2196f3', fontWeight: 600, textDecoration: 'none' }}>
              Sign up
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
