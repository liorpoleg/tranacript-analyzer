import { Virtuoso } from 'react-virtuoso';
import { Box, Card, CircularProgress, Typography, Skeleton, IconButton, Tooltip } from '@mui/material';
import { ArrowsOut } from '@phosphor-icons/react';
import ExpandableEpisodeRow from '../ExpandableEpisodeRow/ExpandableEpisodeRow';
import type { Episode } from '@/core/types';
import styles from './EpisodeTable.module.css';

interface EpisodeTableProps {
  episodes: Episode[];
  isLoading?: boolean;
  onOpen?: (episode: Episode) => void;
  emptyMessage?: string;
  /** Total episode count including ones not yet fetched — defaults to episodes.length
   * (i.e. "everything we have is everything there is") when omitted. */
  totalCount?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onEndReached?: () => void;
  /** The ancestor element that actually scrolls (e.g. the page's own scroll
   * region) — when given, the list scrolls as part of that, no nested
   * scrollbar. Omit to let this table manage its own bounded-height scroll. */
  scrollParent?: HTMLElement | null;
  /** Shows an expand icon button that navigates to the full-page table view.
   * Omit on the full-page view itself. */
  onExpand?: () => void;
}

const HEADERS = ['Ep #', 'Title', 'Air Date', 'Characters', 'Translations', 'Summary', 'Brief Summary', '', ''];

export default function EpisodeTable({
  episodes,
  isLoading = false,
  onOpen,
  emptyMessage = 'No episodes yet.',
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  onEndReached,
  scrollParent,
  onExpand,
}: EpisodeTableProps): JSX.Element {
  const expandButton = onExpand && (
    <Tooltip title="View full page">
      <IconButton size="small" onClick={onExpand} className={styles.expandButton}>
        <ArrowsOut size={15} />
      </IconButton>
    </Tooltip>
  );

  if (isLoading) {
    return (
      <Card className={styles.card}>
        {expandButton}
        <Box className={styles.spinnerWrap}><CircularProgress size={24} /></Box>
      </Card>
    );
  }

  if (episodes.length === 0) {
    return (
      <Card className={styles.card}>
        {expandButton}
        <Typography color="text.secondary" align="center" className={styles.emptyMessage}>{emptyMessage}</Typography>
      </Card>
    );
  }

  const count = totalCount ?? episodes.length;

  return (
    <Card className={styles.card}>
      {expandButton}
      <Box className={styles.scrollWrap}>
        <Box role="row" className={styles.header}>
          {HEADERS.map((h, i) => <Box key={i} role="columnheader" className={styles.headerCell}>{h}</Box>)}
        </Box>
        <Box className={`${styles.body} ${scrollParent ? '' : styles.standaloneHeight}`.trim()}>
          <Virtuoso
            customScrollParent={scrollParent ?? undefined}
            style={scrollParent ? undefined : { height: '100%' }}
            totalCount={count}
            overscan={400}
            endReached={hasNextPage ? onEndReached : undefined}
            components={{
              Footer: () =>
                isFetchingNextPage ? (
                  <Box className={styles.footerLoading}><CircularProgress size={18} /></Box>
                ) : null,
            }}
            itemContent={(index) => {
              const episode = episodes[index];
              if (!episode) {
                return (
                  <Box className={styles.skeletonRow}>
                    <Skeleton variant="rectangular" height={44} />
                  </Box>
                );
              }
              return (
                <ExpandableEpisodeRow
                  episode={episode}
                  onOpen={onOpen ? () => onOpen(episode) : undefined}
                />
              );
            }}
          />
        </Box>
      </Box>
    </Card>
  );
}
