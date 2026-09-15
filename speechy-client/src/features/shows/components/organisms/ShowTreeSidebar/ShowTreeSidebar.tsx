import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import { useShows } from '@/features/shows/services/shows';
import SeasonTreeNode from '@/features/shows/components/molecules/SeasonTreeNode/SeasonTreeNode';
import { ROUTES } from '@/core/constants/routes';
import styles from './ShowTreeSidebar.module.css';

interface ShowTreeSidebarProps {
  onNavigate?: () => void;
}

export default function ShowTreeSidebar({ onNavigate }: ShowTreeSidebarProps): JSX.Element {
  const navigate = useNavigate();
  const { data: shows, isLoading } = useShows();

  const handleCreate = (): void => {
    navigate(ROUTES.SHOW_NEW);
    onNavigate?.();
  };

  return (
    <Box className={styles.root}>
      <Box className={styles.header}>
        <Typography variant="overline" className={styles.headerLabel}>Shows</Typography>
        <Box className={styles.addButton} onClick={handleCreate} role="button" aria-label="Create show">
          <Plus size={13} weight="bold" />
        </Box>
      </Box>

      {isLoading ? (
        <Box className={styles.loading}><CircularProgress size={18} /></Box>
      ) : (
        <Box className={styles.tree}>
          {(shows ?? []).map((show) => (
            <SeasonTreeNode key={show.id} show={show} onNavigate={onNavigate} />
          ))}
          {shows?.length === 0 && (
            <Typography variant="body2" color="text.secondary" className={styles.empty}>
              No shows yet.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
