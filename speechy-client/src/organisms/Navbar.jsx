import { AppBar, Toolbar, Box, Typography, Button, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MonitorPlay, SquaresFour, SignOut, User } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../api/auth';
import { ROUTES } from '../constants/routes';

const NAV_LINKS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: <SquaresFour size={17} /> },
  { label: 'Shows', path: ROUTES.SHOWS, icon: <MonitorPlay size={17} /> },
];

function SpeechyLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="3" y="4" width="26" height="20" rx="9" fill="#2196f3" />
      <path d="M10.5 24 L10.5 29 L17.5 24 Z" fill="#2196f3" />
      <circle cx="12.4" cy="13" r="2.15" fill="#fff" />
      <circle cx="19.6" cy="13" r="2.15" fill="#fff" />
      <path d="M12 17.4 Q16 20.6 20 17.4" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const [anchor, setAnchor] = useState(null);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: 50 }}>
      <Toolbar sx={{ gap: 2.5, height: 66 }}>
        <Box onClick={() => navigate(ROUTES.DASHBOARD)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
          <SpeechyLogo />
          <Typography sx={{ fontFamily: '"Baloo 2"', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.01em' }}>
            Speechy
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          {NAV_LINKS.map((link) => (
            <Button
              key={link.path}
              startIcon={link.icon}
              onClick={() => navigate(link.path)}
              sx={{
                color: location.pathname.startsWith(link.path) ? 'primary.main' : 'text.secondary',
                bgcolor: location.pathname.startsWith(link.path) ? 'primary.50' : 'transparent',
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ ml: 'auto' }} />

        <Box
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 0.75,
            borderRadius: 3, border: '1px solid', borderColor: 'divider',
            cursor: 'pointer', '&:hover': { bgcolor: 'background.default' },
          }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700, borderRadius: 2 }}>
            {initials}
          </Avatar>
          <Box sx={{ lineHeight: 1.15 }}>
            <Typography variant="body2" fontWeight={700}>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary" textTransform="capitalize">{user?.role}</Typography>
          </Box>
        </Box>

        <Menu open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => { setAnchor(null); navigate('/api-keys'); }}>
            <User size={16} style={{ marginRight: 8 }} /> API Keys
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => logout.mutate()} sx={{ color: 'error.main' }}>
            <SignOut size={16} style={{ marginRight: 8 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
