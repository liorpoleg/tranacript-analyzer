import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Box, Typography, TextField } from '@mui/material';
import PageLayout from '../../templates/PageLayout';
import AppButton from '../../atoms/AppButton';
import { useCreateShow } from '../../api/shows';
import { useToast } from '../../contexts/ToastContext';
import { buildRoute } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function ShowCreatePage() {
  usePageTitle('New Show');
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateShow();
  const [form, setForm] = useState({ name: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const show = await create.mutateAsync(form);
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
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="body2" fontWeight={700} mb={0.75}>Show Name *</Typography>
              <TextField fullWidth size="small" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700} mb={0.75}>Description</Typography>
              <TextField fullWidth size="small" multiline rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <AppButton variant="outlined" color="inherit" onClick={() => navigate(-1)}>Cancel</AppButton>
              <AppButton type="submit" variant="contained" loading={create.isLoading}>Create Show</AppButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
