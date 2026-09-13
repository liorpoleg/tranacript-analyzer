import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Typography, Alert, Link as MuiLink } from '@mui/material';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AuthLayout from '@/core/components/templates/AuthLayout/AuthLayout';
import AuthHeader from '@/core/components/molecules/AuthHeader/AuthHeader';
import { useRegister } from '@/core/services/auth';
import { ROUTES } from '@/core/constants/routes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import styles from './SignUpPage.module.css';

interface FieldDef {
  key: string;
  label: string;
  type: string;
  autoFocus?: boolean;
}

const FIELDS: FieldDef[] = [
  { key: 'organization_name', label: 'Organization / Company Name', type: 'text', autoFocus: true },
  { key: 'username', label: 'Username', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'password', label: 'Password', type: 'password' },
  { key: 'confirm_password', label: 'Confirm Password', type: 'password' },
];

interface SignUpForm {
  organization_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  [key: string]: string;
}

interface FormErrors {
  non_field?: string;
  [key: string]: string | string[] | undefined;
}

export default function SignUpPage(): JSX.Element {
  usePageTitle('Sign Up');
  const navigate = useNavigate();
  const register = useRegister();
  const [form, setForm] = useState<SignUpForm>({
    organization_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrors({});
    try {
      await register.mutateAsync(form);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      const e = err as { response?: { data?: { error?: { message?: unknown } } } };
      const data = e?.response?.data?.error;
      if (data && typeof data === 'object' && data.message && typeof data.message === 'object') {
        setErrors(data.message as FormErrors);
      } else {
        const msg = (data as { message?: string } | undefined)?.message;
        setErrors({ non_field: msg || 'Registration failed. Please try again.' });
      }
    }
  };

  return (
    <AuthLayout maxWidth={460}>
      <AuthHeader subtitle="Create your workspace" />

      {errors.non_field && <Alert severity="error" className={styles.errorAlert}>{errors.non_field}</Alert>}

      <Box component="form" onSubmit={handleSubmit} className={styles.form}>
        {FIELDS.map(({ key, label, type, autoFocus }) => (
          <Box key={key}>
            <Typography variant="body2" fontWeight={700} mb={0.75}>{label}</Typography>
            <TextField
              fullWidth size="small" type={type} autoFocus={autoFocus}
              value={(form as Record<string, string>)[key]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              error={Boolean(errors[key])}
              helperText={(errors[key] as string[] | undefined)?.[0] ?? ''}
            />
          </Box>
        ))}

        <AppButton type="submit" variant="contained" size="large" fullWidth loading={register.isLoading} className={styles.submitButton}>
          Create Account
        </AppButton>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" className={styles.signinPrompt}>
        Already have an account?{' '}
        <MuiLink component={Link} to={ROUTES.LOGIN} underline="none" className={styles.signinLink}>
          Sign in
        </MuiLink>
      </Typography>
    </AuthLayout>
  );
}
