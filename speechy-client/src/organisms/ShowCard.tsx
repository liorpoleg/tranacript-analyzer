import { Card, CardContent, Box, Typography } from '@mui/material';
import { Stack, FilmStrip } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { buildRoute } from '../constants/routes';
import type { Show } from '../types';

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
    <Card
      onClick={() => navigate(buildRoute.show(show.id))}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.14s ease, box-shadow 0.14s ease',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.1)',
        },
      }}
    >
      <Box
        sx={{
          height: 88,
          background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
          display: 'flex',
          alignItems: 'flex-end',
          px: 2.5,
          pb: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative circle */}
        <Box sx={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute', top: 10, right: 28,
          width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        <Box
          sx={{
            width: 44, height: 44, borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.95rem', color: '#fff',
            mb: -2.75,
            border: '2px solid rgba(255,255,255,0.3)',
            position: 'relative', zIndex: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </Box>
      </Box>

      <CardContent sx={{ pt: 4, px: 2.5, pb: 2.5 }}>
        <Typography fontWeight={700} fontSize="1rem" noWrap sx={{ mb: 0.5 }}>
          {show.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            minHeight: 38,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
          }}
        >
          {show.description || 'No description.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary' }}>
            <Stack size={13} weight="fill" />
            <Typography variant="caption" fontWeight={600}>{show.season_count ?? 0} seasons</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary' }}>
            <FilmStrip size={13} weight="fill" />
            <Typography variant="caption" fontWeight={600}>{show.episode_count ?? 0} episodes</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
