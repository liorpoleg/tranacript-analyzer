import { Box, Checkbox, FormControlLabel, Typography, Divider, CircularProgress } from '@mui/material';
import type { Episode } from '@/core/types';
import styles from './EpisodeSelector.module.css';

interface EpisodeSelectorProps {
  episodes: Episode[];
  selected: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function EpisodeSelector({
  episodes, selected, onChange, isLoading, emptyMessage = 'No episodes in this season yet.',
}: EpisodeSelectorProps): JSX.Element {
  const allSelected = episodes.length > 0 && selected.length === episodes.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    onChange(allSelected ? [] : episodes.map((e) => e.id));
  };

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id],
    );
  };

  if (isLoading) {
    return <Box className={styles.loading}><CircularProgress size={20} /></Box>;
  }

  if (episodes.length === 0) {
    return <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>;
  }

  return (
    <Box>
      <FormControlLabel
        label={
          <Typography variant="body2" fontWeight={700}>
            Select all ({episodes.length})
          </Typography>
        }
        control={
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleAll}
            size="small"
          />
        }
        className={styles.selectAllRow}
      />
      <Divider className={styles.divider} />
      <Box className={styles.list}>
        {episodes.map((ep) => (
          <FormControlLabel
            key={ep.id}
            label={
              <Typography variant="body2" noWrap className={styles.episodeLabel}>
                <Box component="span" fontWeight={600} color="text.secondary" className={styles.episodeNumber}>
                  {ep.episode_number}
                </Box>
                {ep.title}
              </Typography>
            }
            control={
              <Checkbox
                checked={selected.includes(ep.id)}
                onChange={() => toggle(ep.id)}
                size="small"
              />
            }
            className={styles.episodeRow}
          />
        ))}
      </Box>
    </Box>
  );
}
