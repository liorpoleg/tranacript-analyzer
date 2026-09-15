import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Box, Typography, TextField } from '@mui/material';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import { useCreateShow } from '@/features/shows/services/shows';
import { useToast } from '@/core/contexts/ToastContext';
import { buildRoute } from '@/core/constants/routes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import type { Show } from '@/core/types';
import styles from './ShowCreatePage.module.css';

interface ShowForm {
  name: string;
  description: string;
  [key: string]: string;
}

export default function ShowCreatePage(): JSX.Element {
  usePageTitle('New Show');
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateShow();
  const [form, setForm] = useState<ShowForm>({ name: '', description: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const show = await create.mutateAsync(form) as Show;
      toast.show('Show created!', 'success');
      navigate(buildRoute.show(show.id));
    } catch {
      toast.show('Failed to create show.', 'error');
    }
  };

  return (
    <PageLayout maxWidth={600}>
      <Typography variant="h2" mb={3}>New TV Show</Typography>
      <Card>
        <CardContent className={styles.cardContent}>
          <Box component="form" onSubmit={handleSubmit} className={styles.form}>
            <Box>
              <Typography variant="body2" fontWeight={700} mb={0.75}>Show Name *</Typography>
              <TextField fullWidth size="small" required value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700} mb={0.75}>Description</Typography>
              <TextField fullWidth size="small" multiline rows={3} value={form.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </Box>
            <Box className={styles.actions}>
              <AppButton variant="outlined" color="inherit" onClick={() => navigate(-1)}>Cancel</AppButton>
              <AppButton type="submit" variant="contained" loading={create.isLoading}>Create Show</AppButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
