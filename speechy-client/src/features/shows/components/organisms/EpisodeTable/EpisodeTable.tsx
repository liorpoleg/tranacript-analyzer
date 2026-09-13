import {
  Box, Card, Table, TableHead, TableBody, TableRow, TableCell,
  CircularProgress, Typography,
} from '@mui/material';
import ExpandableEpisodeRow from '../ExpandableEpisodeRow/ExpandableEpisodeRow';
import type { Episode } from '@/core/types';
import styles from './EpisodeTable.module.css';

interface EpisodeTableProps {
  episodes: Episode[];
  isLoading?: boolean;
  onOpen?: (episode: Episode) => void;
  emptyMessage?: string;
}

export default function EpisodeTable({ episodes, isLoading = false, onOpen, emptyMessage = 'No episodes yet.' }: EpisodeTableProps): JSX.Element {
  const columnCount = onOpen ? 9 : 8;

  return (
    <Card className={styles.card}>
      <Box className={styles.scrollWrap}>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell className={styles.colEpisode}>Ep #</TableCell>
              <TableCell className={styles.colTitle}>Title</TableCell>
              <TableCell className={styles.colAirDate}>Air Date</TableCell>
              <TableCell className={styles.colCharacters}>Characters</TableCell>
              <TableCell className={styles.colTranslations}>Translations</TableCell>
              <TableCell className={styles.colSummary}>Summary</TableCell>
              <TableCell>Brief Summary</TableCell>
              <TableCell className={styles.colIcon} />
              {onOpen && <TableCell className={styles.colIcon} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columnCount} align="center"><CircularProgress size={24} className={styles.spinner} /></TableCell></TableRow>
            ) : episodes.length === 0 ? (
              <TableRow><TableCell colSpan={columnCount} align="center"><Typography color="text.secondary" className={styles.emptyMessage}>{emptyMessage}</Typography></TableCell></TableRow>
            ) : episodes.map((ep) => (
              <ExpandableEpisodeRow key={ep.id} episode={ep} onOpen={onOpen ? () => onOpen(ep) : undefined} />
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}
