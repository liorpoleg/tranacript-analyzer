import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Alert } from '@mui/material';
import { Trash } from '@phosphor-icons/react';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import { useUpdateEpisode, useDeleteEpisode } from '@/features/episodes/services/episodes';
import { useToast } from '@/core/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { buildRoute } from '@/core/constants/routes';
import type { Episode } from '@/core/types';
import styles from './EpisodeSettingsTab.module.css';

interface EpisodeFormState {
  title: string;
  episode_number: string;
  [key: string]: string;
}

interface SettingsTabProps {
  episode: Episode;
}

export default function SettingsTab({ episode }: SettingsTabProps): JSX.Element {
  const toast = useToast();
  const navigate = useNavigate();
  const update = useUpdateEpisode(episode.id);
  const del = useDeleteEpisode();
  const [form, setForm] = useState<EpisodeFormState>({ title: episode.title, episode_number: episode.episode_number });
  const [deleteModal, setDeleteModal] = useState<boolean>(false);

  const handleSave = async (): Promise<void> => {
    try {
      await update.mutateAsync(form);
      toast.show('Episode updated.', 'success');
    } catch {
      toast.show('Update failed.', 'error');
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await del.mutateAsync(episode.id);
      toast.show('Episode deleted.', 'success');
      navigate(buildRoute.show(episode.primary_show));
    } catch {
      toast.show('Delete failed.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h2" className={styles.title}>Settings</Typography>
      <Card className={styles.detailsCard}>
        <CardContent className={styles.cardContent}>
          <Typography fontWeight={700} className={styles.sectionTitle}>Episode Details</Typography>
          <Box className={styles.form}>
            {(['title', 'episode_number'] as const).map((field) => {
              const label = field === 'title' ? 'Title' : 'Episode Number';
              return (
                <Box key={field}>
                  <Typography variant="body2" fontWeight={700} mb={0.75}>{label}</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={form[field]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                  />
                </Box>
              );
            })}
            <AppButton variant="contained" onClick={handleSave} loading={update.isLoading} className={styles.saveButton}>Save Changes</AppButton>
          </Box>
        </CardContent>
      </Card>

      <Card className={styles.dangerCard}>
        <CardContent className={styles.cardContent}>
          <Typography fontWeight={700} color="error.main" className={styles.dangerTitle}>Danger Zone</Typography>
          <Typography variant="body2" color="text.secondary" className={styles.dangerDesc}>Deleting an episode removes all its translations, summaries, and jobs permanently.</Typography>
          <AppButton variant="outlined" color="error" startIcon={<Trash size={16} />} onClick={() => setDeleteModal(true)}>
            Delete Episode
          </AppButton>
        </CardContent>
      </Card>

      <AppModal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Episode" onConfirm={handleDelete} confirmLabel="Delete" confirmColor="error" loading={del.isLoading}>
        <Alert severity="error">This action cannot be undone. All data for this episode will be permanently deleted.</Alert>
      </AppModal>
    </Box>
  );
}
