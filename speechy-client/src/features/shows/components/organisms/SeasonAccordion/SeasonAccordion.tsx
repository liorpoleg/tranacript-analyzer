import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack, Collapse, TextField } from '@mui/material';
import { Plus, ChatCircleText, Upload, CaretDown, CaretRight } from '@phosphor-icons/react';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import EpisodeTable from '@/features/shows/components/organisms/EpisodeTable/EpisodeTable';
import { useSeasonEpisodes, useCreateEpisode, useSeasonUpload } from '@/features/episodes/services/episodes';
import { useToast } from '@/core/contexts/ToastContext';
import { buildRoute } from '@/core/constants/routes';
import type { Season } from '@/core/types';
import styles from './SeasonAccordion.module.css';

interface EpisodeFormState {
  episode_number: string;
  title: string;
  air_date: string;
}

interface SeasonAccordionProps {
  season: Season;
  showId: string;
}

export default function SeasonAccordion({ season, showId }: SeasonAccordionProps): JSX.Element {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: episodes = [], isLoading } = useSeasonEpisodes(season.id);
  const createEpisode = useCreateEpisode();
  const seasonUpload = useSeasonUpload(season.id);
  const [open, setOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [form, setForm] = useState<EpisodeFormState>({ episode_number: '', title: '', air_date: '' });

  const handleCreate = async (): Promise<void> => {
    try {
      const ep = await createEpisode.mutateAsync({ ...form, primary_show: showId, season: season.id });
      toast.show('Episode created!', 'success');
      setOpen(false);
      navigate(buildRoute.episode(ep.id));
    } catch {
      toast.show('Failed to create episode.', 'error');
    }
  };

  const handleSeasonUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await seasonUpload.mutateAsync(file);
      toast.show(`Uploaded ${result.episodes_created} episode(s)!`, 'success');
    } catch {
      toast.show('Season upload failed.', 'error');
    }
    e.target.value = '';
  };

  return (
    <>
      <Box
        onClick={() => setCollapsed((c) => !c)}
        className={`${styles.header} ${collapsed ? styles.headerCollapsed : styles.headerExpanded}`}
      >
        <Box className={styles.headerLeft}>
          {collapsed ? <CaretRight size={15} weight="bold" /> : <CaretDown size={15} weight="bold" />}
          <Typography fontWeight={700}>
            Season {season.number}{season.title ? ` — ${season.title}` : ''}
          </Typography>
          {collapsed && episodes.length > 0 && (
            <Typography variant="body1" color="text.secondary">
              {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Box className={styles.headerActions} onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            startIcon={<ChatCircleText size={14} />}
            onClick={() => navigate(buildRoute.season(season.id))}
            className={styles.actionButton}
          >
            Chat & Settings
          </Button>
          <Button
            size="small"
            component="label"
            startIcon={<Upload size={14} />}
            disabled={seasonUpload.isLoading}
            className={styles.actionButton}
          >
            {seasonUpload.isLoading ? 'Uploading…' : 'Upload Season'}
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleSeasonUpload} />
          </Button>
          <AppButton size="small" startIcon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Add Episode
          </AppButton>
        </Box>
      </Box>

      <Collapse in={!collapsed}>
        <Box className={styles.tableWrap}>
          <EpisodeTable
            episodes={episodes}
            isLoading={isLoading}
            onOpen={(ep) => navigate(buildRoute.episode(ep.id))}
          />
        </Box>
      </Collapse>

      <AppModal open={open} onClose={() => setOpen(false)} title="Add Episode" onConfirm={handleCreate} confirmLabel="Create" loading={createEpisode.isLoading}>
        <Stack spacing={2}>
          {(['episode_number', 'title', 'air_date'] as const).map((field) => {
            const labelMap: Record<typeof field, string> = {
              episode_number: 'Episode Number *',
              title: 'Title *',
              air_date: 'Air Date',
            };
            return (
              <Box key={field}>
                <Typography variant="body2" fontWeight={700} mb={0.75}>{labelMap[field]}</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type={field === 'air_date' ? 'date' : 'text'}
                  value={form[field]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                />
              </Box>
            );
          })}
        </Stack>
      </AppModal>
    </>
  );
}
