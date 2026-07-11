import {
  AppBar, Toolbar, Box, Typography, Avatar, Menu, MenuItem, Divider, IconButton,
  Select, InputBase, Paper, ClickAwayListener, CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SquaresFour, BookOpen, SignOut, Key, CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../api/auth';
import { useShows, useShowSearch } from '../api/shows';
import { useDebounce } from '../hooks/useDebounce';
import HighlightedText from '../atoms/HighlightedText';
import { ROUTES, buildRoute } from '../constants/routes';
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

  const { data: shows } = useShows();
  const [selectedShowId, setSelectedShowId] = useState('');
  const [query, setQuery] = useState('');
  const [resultsOpen, setResultsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const trimmedQuery = debouncedQuery.trim();
  const hasPrefix = trimmedQuery.startsWith('@') || trimmedQuery.startsWith('#');
  const highlightTerm = hasPrefix ? trimmedQuery.slice(1).trim() : trimmedQuery;
  const { data: results, isFetching: searching } = useShowSearch(selectedShowId || undefined, debouncedQuery);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const resultRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedQuery, selectedShowId]);

  useEffect(() => {
    if (highlightedIndex >= 0) {
      resultRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const goToResult = (episodeId: string): void => {
    navigate(buildRoute.episode(episodeId));
    setResultsOpen(false);
    setQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!results || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        goToResult(results[highlightedIndex].episode_id);
      }
    } else if (e.key === 'Escape') {
      setResultsOpen(false);
    }
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';
  const avatarColor = getAvatarColor(user?.username);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: 50, bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ position: 'relative', gap: 1, height: 60, minHeight: '60px !important', px: { xs: 2, md: 4 } }}>
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

        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 520,
            px: 2,
          }}
        >
          <ClickAwayListener onClickAway={() => setResultsOpen(false)}>
            <Box sx={{ position: 'relative', width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  pl: 1.5,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  '&:focus-within': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 3px rgba(33,150,243,0.12)',
                  },
                }}
              >
                <MagnifyingGlass size={16} style={{ flexShrink: 0, color: '#94A3B8' }} />
                <InputBase
                  fullWidth
                  size="small"
                  placeholder={selectedShowId ? 'Search transcripts, @character, or #tag' : 'Select a show to search'}
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setQuery(e.target.value);
                    setResultsOpen(true);
                  }}
                  onFocus={() => setResultsOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  sx={{ ml: 1, fontSize: '0.875rem', flex: 1 }}
                />
                <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
                <Select
                  size="small"
                  displayEmpty
                  variant="standard"
                  disableUnderline
                  value={selectedShowId}
                  onChange={(e: SelectChangeEvent) => setSelectedShowId(e.target.value)}
                  sx={{
                    minWidth: 110, maxWidth: 160, flexShrink: 0, fontSize: '0.8rem', pl: 1.25, pr: 0.5,
                    '& .MuiSelect-select': { py: 0.75 },
                  }}
                >
                  <MenuItem value="">
                    <Typography variant="body2" color="text.secondary">Show…</Typography>
                  </MenuItem>
                  {(shows ?? []).map((show) => (
                    <MenuItem key={show.id} value={show.id}>{show.name}</MenuItem>
                  ))}
                </Select>
              </Box>

              {resultsOpen && query.trim().length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    position: 'absolute', top: '100%', left: 0, right: 0, mt: 0.5,
                    border: '1px solid', borderColor: 'divider', borderRadius: 3,
                    maxHeight: 360, overflowY: 'auto', zIndex: 60,
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  }}
                >
                  {!selectedShowId ? (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">Select a show to search.</Typography>
                    </Box>
                  ) : debouncedQuery.trim().length < 2 ? (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">Keep typing…</Typography>
                    </Box>
                  ) : searching ? (
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : !results?.length ? (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">No results found.</Typography>
                    </Box>
                  ) : (
                    results.map((r, i) => (
                      <Box
                        key={`${r.episode_id}-${i}`}
                        ref={(el: HTMLDivElement | null) => { resultRefs.current[i] = el; }}
                        onClick={() => goToResult(r.episode_id)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        sx={{
                          px: 2, py: 1.25, cursor: 'pointer',
                          borderBottom: i < results.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          bgcolor: highlightedIndex === i ? '#EFF6FF' : 'transparent',
                          '&:hover': { bgcolor: '#F8FAFC' },
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {r.episode_number ? `${r.episode_number} — ${r.episode_title}` : r.episode_title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          <HighlightedText text={r.snippet} term={highlightTerm} />
                        </Typography>
                      </Box>
                    ))
                  )}
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
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
