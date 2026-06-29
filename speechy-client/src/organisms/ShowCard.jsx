import { Card, CardContent, Box, Typography } from '@mui/material';
import { MonitorPlay, Buildings } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { buildRoute } from '../constants/routes';

const COLORS = ['#2196f3', '#0288d1', '#0277bd', '#01579b', '#006db3', '#4fc3f7'];

function getColor(name = '') {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

export default function ShowCard({ show }) {
  const navigate = useNavigate();
  const initials = show.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const color = getColor(show.name);

  return (
    <Card
      onClick={() => navigate(buildRoute.show(show.id))}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.14s, box-shadow 0.14s',
        overflow: 'hidden',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 30px rgba(0,0,0,0.1)' },
      }}
    >
      <Box sx={{ height: 80, bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontFamily: '"Baloo 2"', fontWeight: 800, fontSize: '1.8rem', color: '#fff' }}>
          {initials}
        </Typography>
      </Box>
      <CardContent sx={{ p: 2.5 }}>
        <Typography fontWeight={700} fontSize="1.05rem" noWrap>{show.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {show.description || 'No description.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MonitorPlay size={14} />
            <Typography variant="caption">{show.episode_count} episodes</Typography>
          </Box>
          {show.organization_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Buildings size={14} />
              <Typography variant="caption">{show.organization_name}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
