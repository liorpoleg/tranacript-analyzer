import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Typography, Alert } from '@mui/material';
import AppButton from '../../atoms/AppButton';
import { useRegister } from '../../api/auth';
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

const FIELDS = [
  { key: 'organization_name', label: 'Organization / Company Name', type: 'text', autoFocus: true },
  { key: 'username', label: 'Username', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'password', label: 'Password', type: 'password' },
  { key: 'confirm_password', label: 'Confirm Password', type: 'password' },
];

export default function SignUpPage() {
  usePageTitle('Sign Up');
  const navigate = useNavigate();
  const register = useRegister();
  const [form, setForm] = useState({
    organization_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await register.mutateAsync(form);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      const data = err?.response?.data?.error;
      if (data && typeof data === 'object' && data.message && typeof data.message === 'object') {
        setErrors(data.message);
      } else {
        setErrors({ non_field: data?.message || 'Registration failed. Please try again.' });
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 460 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SpeechyLogo />
            <Typography sx={{ fontFamily: '"Baloo 2"', fontWeight: 800, fontSize: '1.8rem', mt: 1 }}>Speechy</Typography>
            <Typography color="text.secondary" variant="body2">Create your workspace</Typography>
          </Box>

          {errors.non_field && <Alert severity="error" sx={{ mb: 2 }}>{errors.non_field}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FIELDS.map(({ key, label, type, autoFocus }) => (
              <Box key={key}>
                <Typography variant="body2" fontWeight={700} mb={0.75}>{label}</Typography>
                <TextField
                  fullWidth size="small" type={type} autoFocus={autoFocus}
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  error={Boolean(errors[key])}
                  helperText={errors[key]?.[0] ?? ''}
                />
              </Box>
            ))}

            <AppButton type="submit" variant="contained" size="large" fullWidth loading={register.isLoading} sx={{ mt: 1 }}>
              Create Account
            </AppButton>
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2.5}>
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} style={{ color: '#2196f3', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
