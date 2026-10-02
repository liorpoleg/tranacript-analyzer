import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { buildRoute } from '@/core/constants/routes';
import type { Show } from '@/core/types';
import styles from './ShowListItem.module.css';

const SHOW_AVATARS = ['#2F6277', '#4C8599', '#5FC9CC', '#6FA8B5', '#3F7A57', '#234A59'];
function getAvatarColor(name = ''): string {
  return SHOW_AVATARS[name.charCodeAt(0) % SHOW_AVATARS.length];
}

interface ShowListItemProps {
  show: Show;
}

export default function ShowListItem({ show }: ShowListItemProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <Box onClick={() => navigate(buildRoute.show(show.id))} className={styles.row}>
      <Box className={styles.avatar} style={{ '--avatar-color': getAvatarColor(show.name) } as React.CSSProperties}>
        {show.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
      </Box>
      <Box className={styles.info}>
        <Typography fontWeight={700} fontSize="0.875rem" noWrap>{show.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {show.episode_count ?? 0} episodes
        </Typography>
      </Box>
    </Box>
  );
}
