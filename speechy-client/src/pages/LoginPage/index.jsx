import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Typography, Alert } from '@mui/material';
import AppButton from '../../atoms/AppButton';
import { useLogin } from '../../api/auth';
import { ROUTES } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';

function SpeechyLogo() {
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

export default function LoginPage() {
  usePageTitle('Login');
  const navigate = useNavigate();
  const login = useLogin();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login.mutateAsync(form);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      setError('Invalid username or password.');
    }
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
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700} mb={0.75}>Password</Typography>
              <TextField
                fullWidth size="small" type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </Box>
            <AppButton type="submit" variant="contained" size="large" fullWidth loading={login.isLoading} sx={{ mt: 1 }}>
              Sign In
            </AppButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
