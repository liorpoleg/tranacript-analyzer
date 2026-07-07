import { AppBar, Toolbar, Box, Typography, Button, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MonitorPlay, SquaresFour, SignOut, User } from '@phosphor-icons/react';
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
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: <SquaresFour size={17} /> },
  { label: 'Shows', path: ROUTES.SHOWS, icon: <MonitorPlay size={17} /> },
];

function SpeechyLogo(): JSX.Element {
  return (<svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="400" cy="320" r="280" fill="#A1E8E3"/>
  <circle cx="400" cy="320" r="260" fill="#7EDCD4"/>

  <path d="M180 280 Q120 220 150 160 Q200 140 260 180 Q280 240 220 300 Q180 340 150 400 Q120 440 170 480 Q220 490 280 440" fill="#00B8E0" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round"/>

  <path d="M310 250 Q310 380 310 480 L310 500 Q310 520 330 520 Q350 520 350 500 L350 300 Q350 260 340 255" fill="#00B8E0" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round"/>

  <path d="M380 320 Q410 280 460 280 Q490 280 500 320 Q500 350 470 370 Q410 380 390 355" fill="#00B8E0" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round"/>

  <path d="M530 320 Q560 280 610 280 Q640 280 650 320 Q650 350 620 370 Q560 380 540 355" fill="#00B8E0" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round"/>

  <path d="M680 310 Q710 280 760 295 Q780 320 760 360 Q720 385 680 355" fill="#00B8E0" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round"/>

  <path d="M310 250 L310 480" fill="none" stroke="#00B8E0" strokeWidth="25" strokeLinecap="round"/>
  <path d="M310 300 Q340 260 380 300" fill="none" stroke="#00B8E0" strokeWidth="18" strokeLinejoin="round"/>

  <path d="M760 300 Q780 340 760 400 Q740 460 710 480" fill="none" stroke="#00B8E0" strokeWidth="18" strokeLinejoin="round"/>

  <path d="M240 180 Q255 140 275 155" fill="none" stroke="#00B8E0" strokeWidth="12" strokeLinecap="round"/>
  <path d="M240 180 Q255 120 280 130" fill="none" stroke="#00B8E0" strokeWidth="12" strokeLinecap="round"/>
  <path d="M240 180 Q255 100 285 105" fill="none" stroke="#00B8E0" strokeWidth="12" strokeLinecap="round"/>

  <text x="195" y="385" fontFamily="sans-serif" fontSize="195" fontWeight="bold" fill="none" stroke="#FFFFFF" strokeWidth="22" paintOrder="stroke" letterSpacing="-8">Speechy</text>
  <text x="195" y="385" fontFamily="sans-serif" fontSize="195" fontWeight="bold" fill="#00B8E0" letterSpacing="-8">Speechy</text>
</svg>);
}

export default function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: 50 }}>
      <Toolbar sx={{ gap: 2.5, height: 66 }}>
        <Box onClick={() => navigate(ROUTES.DASHBOARD)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
          {/* <SpeechyLogo/> */}
          <Box component="img" src={logo} alt="Speechy" sx={{ height: 48, width: 'auto', objectFit: 'contain' }} />
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
          onClick={(e: React.MouseEvent<HTMLDivElement>) => setAnchor(e.currentTarget)}
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
