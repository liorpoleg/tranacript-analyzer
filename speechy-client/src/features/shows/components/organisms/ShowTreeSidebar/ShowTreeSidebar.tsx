import { useState } from 'react';
import { Box, Typography, CircularProgress, InputBase } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, CaretLeft } from '@phosphor-icons/react';
import { useShows, useShowNameSearch } from '@/features/shows/services/shows';
import { useDebounce } from '@/core/hooks/useDebounce';
import SeasonTreeNode from '@/features/shows/components/molecules/SeasonTreeNode/SeasonTreeNode';
import { ROUTES, buildRoute } from '@/core/constants/routes';
import styles from './ShowTreeSidebar.module.css';

interface ShowTreeSidebarProps {
  onNavigate?: () => void;
  onCollapse?: () => void;
}

export default function ShowTreeSidebar({ onNavigate, onCollapse }: ShowTreeSidebarProps): JSX.Element {
  const navigate = useNavigate();
  const { data: shows, isLoading } = useShows();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const searching = debouncedQuery.trim().length > 0;
  // Backend-driven — searches the whole org tree by name, not just the
  // already-fetched root-level list, see useShowNameSearch.
  const { data: searchResults, isFetching: searchLoading } = useShowNameSearch(debouncedQuery);

  const handleCreate = (): void => {
    navigate(ROUTES.SHOW_NEW);
    onNavigate?.();
  };

  const goToResult = (id: string): void => {
    navigate(buildRoute.show(id));
    onNavigate?.();
  };

  return (
    <Box className={styles.root}>
      <Box className={styles.header}>
        <Typography variant="overline" className={styles.headerLabel}>Shows</Typography>
        <Box className={styles.headerActions}>
          <Box className={styles.addButton} onClick={handleCreate} role="button" aria-label="Create show">
            <Plus size={13} weight="bold" />
          </Box>
          {onCollapse && (
            <Box className={styles.collapseButton} onClick={onCollapse} role="button" aria-label="Collapse sidebar">
              <CaretLeft size={13} weight="bold" />
            </Box>
          )}
        </Box>
      </Box>

      <Box className={styles.searchBar}>
        <MagnifyingGlass size={14} color="#9BB0B4" style={{ flexShrink: 0 }} />
        <InputBase
          size="small"
          placeholder="Search shows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
      </Box>

      {searching ? (
        searchLoading ? (
          <Box className={styles.loading}><CircularProgress size={18} /></Box>
        ) : !searchResults?.length ? (
          <Typography variant="body2" color="text.secondary" className={styles.empty}>
            No shows match "{debouncedQuery}".
          </Typography>
        ) : (
          <Box className={styles.tree}>
            {searchResults.map((show) => (
              <Box
                key={show.id}
                className={styles.searchResultRow}
                onClick={() => goToResult(show.id)}
              >
                <Typography noWrap variant="body2" fontWeight={600} className={styles.label}>
                  {show.name}
                </Typography>
                {show.episode_count > 0 && <Box className={styles.countPill}>{show.episode_count}</Box>}
              </Box>
            ))}
          </Box>
        )
      ) : isLoading ? (
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
