import { Box, Checkbox, FormControlLabel, Typography, Divider, CircularProgress } from '@mui/material';
import type { Episode } from '../types';

interface EpisodeSelectorProps {
  episodes: Episode[];
  selected: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
}

export default function EpisodeSelector({ episodes, selected, onChange, isLoading }: EpisodeSelectorProps): JSX.Element {
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
    return <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>;
  }

  if (episodes.length === 0) {
    return <Typography variant="body2" color="text.secondary">No episodes in this season yet.</Typography>;
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
        sx={{ mb: 0.5 }}
      />
      <Divider sx={{ mb: 1 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, maxHeight: 240, overflowY: 'auto' }}>
        {episodes.map((ep) => (
          <FormControlLabel
            key={ep.id}
            label={
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                <Box component="span" fontWeight={600} color="text.secondary" sx={{ mr: 0.75, fontSize: '0.8rem', fontFamily: 'monospace' }}>
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
            sx={{ ml: 0.5, mr: 0 }}
          />
        ))}
      </Box>
    </Box>
  );
}
