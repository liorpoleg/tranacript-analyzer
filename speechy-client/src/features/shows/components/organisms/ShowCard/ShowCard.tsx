import { Card, CardContent, Box, Typography } from '@mui/material';
import { Stack, FilmStrip } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { buildRoute } from '@/core/constants/routes';
import type { Show } from '@/core/types';
import styles from './ShowCard.module.css';

const PALETTES = [
  { from: '#64b5f6', to: '#1565c0' },
  { from: '#4fc3f7', to: '#0277bd' },
  { from: '#29b6f6', to: '#01579b' },
  { from: '#42a5f5', to: '#0d47a1' },
  { from: '#81d4fa', to: '#006db3' },
  { from: '#039be5', to: '#1565c0' },
];

function getPalette(name = '') {
  return PALETTES[name.charCodeAt(0) % PALETTES.length];
}

interface ShowCardProps {
  show: Show;
}

export default function ShowCard({ show }: ShowCardProps): JSX.Element {
  const navigate = useNavigate();
  const initials = show.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const palette = getPalette(show.name);

  return (
    <Card onClick={() => navigate(buildRoute.show(show.id))} className={styles.card}>
      <Box
        className={styles.banner}
        style={{ '--banner-from': palette.from, '--banner-to': palette.to } as React.CSSProperties}
      >
        <Box className={styles.decorativeCircleLarge} />
        <Box className={styles.decorativeCircleSmall} />

        <Box className={styles.initials}>
          {initials}
        </Box>
      </Box>

      <CardContent className={styles.content}>
        <Typography fontWeight={700} fontSize="1rem" noWrap className={styles.title}>
          {show.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" className={styles.description}>
          {show.description || 'No description.'}
        </Typography>

        <Box className={styles.stats}>
          <Box className={styles.stat}>
            <Stack size={13} weight="fill" />
            <Typography variant="caption" fontWeight={600}>{show.direct_children_count ?? 0} seasons</Typography>
          </Box>
          <Box className={styles.stat}>
            <FilmStrip size={13} weight="fill" />
            <Typography variant="caption" fontWeight={600}>{show.episode_count ?? 0} episodes</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
