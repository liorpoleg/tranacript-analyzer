import { AppBar, Toolbar, Box, Typography, Avatar, Menu, MenuItem, Divider, IconButton } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SquaresFour, BookOpen, SignOut, Key, CaretDown } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../api/auth';
import { ROUTES } from '../constants/routes';
import logo from '../assets/logo2.png';

interface NavLink {
  label: string;
  path: string;
  icon: JSX.Element;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: <SquaresFour size={16} weight="fill" /> },
  { label: 'Shows', path: ROUTES.SHOWS, icon: <BookOpen size={16} weight="fill" /> },
];

const AVATAR_COLORS = ['#2196f3', '#0288d1', '#0277bd', '#01579b', '#006db3', '#4fc3f7'];

function getAvatarColor(name = ''): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';
  const avatarColor = getAvatarColor(user?.username);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: 50, bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ gap: 1, height: 60, minHeight: '60px !important', px: { xs: 2, md: 4 } }}>
        <Box
          onClick={() => navigate(ROUTES.DASHBOARD)}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 2, flexShrink: 0 }}
        >
          <Box component="img" src={logo} alt="Speechy" sx={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, height: '100%', alignItems: 'stretch' }}>
          {NAV_LINKS.map((link) => {
            const active = location.pathname.startsWith(link.path);
            return (
              <Box
                key={link.path}
                onClick={() => navigate(link.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  cursor: 'pointer',
                  position: 'relative',
                  color: active ? 'primary.main' : 'text.secondary',
                  fontWeight: active ? 700 : 600,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  borderBottom: '2px solid',
                  borderColor: active ? 'primary.main' : 'transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                  '&:hover': { color: 'text.primary' },
                  userSelect: 'none',
                }}
              >
                <Box sx={{ display: 'flex', color: active ? 'primary.main' : 'text.disabled' }}>
                  {link.icon}
                </Box>
                {link.label}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Box
          onClick={(e: React.MouseEvent<HTMLDivElement>) => setAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.75,
            borderRadius: 99, cursor: 'pointer',
            '&:hover': { bgcolor: '#F1F5F9' },
            transition: 'background 0.15s',
          }}
        >
          <Avatar
            sx={{
              width: 32, height: 32,
              bgcolor: avatarColor,
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: 'inherit',
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ lineHeight: 1.2, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={700} lineHeight={1.2}>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', lineHeight: 1 }}>
              {user?.role}
            </Typography>
          </Box>
          <CaretDown size={14} style={{ color: '#94A3B8' }} />
        </Box>

        <Menu
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          PaperProps={{
            elevation: 0,
            sx: {
              border: '1px solid', borderColor: 'divider',
              borderRadius: 3,
              minWidth: 180,
              mt: 0.5,
              boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={700}>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchor(null); navigate('/api-keys'); }} sx={{ gap: 1.25, py: 1.25 }}>
            <Key size={15} style={{ color: '#64748B' }} />
            <Typography variant="body2" fontWeight={600}>API Keys</Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => logout.mutate()}
            sx={{ gap: 1.25, py: 1.25, color: 'error.main', '&:hover': { bgcolor: '#FEF2F2' } }}
          >
            <SignOut size={15} />
            <Typography variant="body2" fontWeight={600} color="error.main">Sign out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
