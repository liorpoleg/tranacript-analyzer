import {
  AppBar, Toolbar, Box, Typography, Avatar, Menu, MenuItem, Divider, IconButton,
  Select, InputBase, Paper, ClickAwayListener, CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SquaresFour, BookOpen, SignOut, Key, CaretDown, MagnifyingGlass, List as ListIcon } from '@phosphor-icons/react';
import { useAuth } from '@/core/hooks/useAuth';
import { useLogout } from '@/core/services/auth';
import { useShows, useShowSearch } from '@/features/shows/services/shows';
import { useDebounce } from '@/core/hooks/useDebounce';
import HighlightedText from '@/core/components/atoms/HighlightedText/HighlightedText';
import { ROUTES, buildRoute } from '@/core/constants/routes';
import logo from '@/assets/logo2.png';
import styles from './Navbar.module.css';

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
  const [navAnchor, setNavAnchor] = useState<HTMLElement | null>(null);

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
    <AppBar position="sticky" color="inherit" elevation={0} className={styles.appBar}>
      <Toolbar className={styles.toolbar}>
        <Box onClick={() => navigate(ROUTES.DASHBOARD)} className={styles.logoWrapper}>
          <Box component="img" src={logo} alt="Speechy" className={styles.logoImg} />
        </Box>

        <IconButton
          onClick={(e: React.MouseEvent<HTMLElement>) => setNavAnchor(e.currentTarget)}
          className={styles.mobileMenuButton}
          aria-label="Open navigation menu"
        >
          <ListIcon size={20} />
        </IconButton>
        <Menu open={Boolean(navAnchor)} anchorEl={navAnchor} onClose={() => setNavAnchor(null)}>
          {NAV_LINKS.map((link) => (
            <MenuItem
              key={link.path}
              selected={location.pathname.startsWith(link.path)}
              onClick={() => { navigate(link.path); setNavAnchor(null); }}
              className={styles.mobileMenuItem}
            >
              {link.icon}
              <Typography variant="body2" fontWeight={600}>{link.label}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Box className={styles.navLinks}>
          {NAV_LINKS.map((link) => {
            const active = location.pathname.startsWith(link.path);
            return (
              <Box
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`.trim()}
              >
                <Box className={`${styles.navLinkIcon} ${active ? styles.navLinkIconActive : ''}`.trim()}>
                  {link.icon}
                </Box>
                {link.label}
              </Box>
            );
          })}
        </Box>

        <Box className={styles.searchWrapper}>
          <ClickAwayListener onClickAway={() => setResultsOpen(false)}>
            <Box className={styles.searchInner}>
              <Box className={styles.searchBar}>
                <MagnifyingGlass size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
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
                  className={styles.searchInput}
                />
                <Divider orientation="vertical" flexItem className={styles.searchDivider} />
                <Select
                  size="small"
                  displayEmpty
                  variant="standard"
                  disableUnderline
                  value={selectedShowId}
                  onChange={(e: SelectChangeEvent) => setSelectedShowId(e.target.value)}
                  className={styles.showSelect}
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
                <Paper elevation={0} className={styles.resultsPaper}>
                  {!selectedShowId ? (
                    <Box className={styles.resultsMessage}>
                      <Typography variant="body2" color="text.secondary">Select a show to search.</Typography>
                    </Box>
                  ) : debouncedQuery.trim().length < 2 ? (
                    <Box className={styles.resultsMessage}>
                      <Typography variant="body2" color="text.secondary">Keep typing…</Typography>
                    </Box>
                  ) : searching ? (
                    <Box className={styles.resultsMessageCentered}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : !results?.length ? (
                    <Box className={styles.resultsMessage}>
                      <Typography variant="body2" color="text.secondary">No results found.</Typography>
                    </Box>
                  ) : (
                    results.map((r, i) => (
                      <Box
                        key={`${r.episode_id}-${i}`}
                        ref={(el: HTMLDivElement | null) => { resultRefs.current[i] = el; }}
                        onClick={() => goToResult(r.episode_id)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        className={`${styles.resultRow} ${highlightedIndex === i ? styles.resultRowHighlighted : ''}`.trim()}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {r.episode_number ? `${r.episode_number} — ${r.episode_title}` : r.episode_title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" className={styles.resultSnippet}>
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

        <Box className={styles.spacer} />

        <Box onClick={(e: React.MouseEvent<HTMLDivElement>) => setAnchor(e.currentTarget)} className={styles.userMenuTrigger}>
          <Avatar className={styles.avatar} style={{ '--avatar-color': avatarColor } as React.CSSProperties}>
            {initials}
          </Avatar>
          <Box className={styles.userInfo}>
            <Typography variant="body2" fontWeight={700} lineHeight={1.2}>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary" className={styles.userRole}>
              {user?.role}
            </Typography>
          </Box>
          <CaretDown size={14} color="#94A3B8" />
        </Box>

        <Menu
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          PaperProps={{ elevation: 0, className: styles.userMenuPaper }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box className={styles.userMenuHeader}>
            <Typography variant="body2" fontWeight={700}>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchor(null); navigate('/api-keys'); }} className={styles.menuItem}>
            <Key size={15} color="#64748B" />
            <Typography variant="body2" fontWeight={600}>API Keys</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => logout.mutate()} className={styles.menuItemDanger}>
            <SignOut size={15} />
            <Typography variant="body2" fontWeight={600} color="error.main">Sign out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
