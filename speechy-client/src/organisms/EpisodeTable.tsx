import {
  Box, Card, Table, TableHead, TableBody, TableRow, TableCell,
  CircularProgress, Typography,
} from '@mui/material';
import ExpandableEpisodeRow from './ExpandableEpisodeRow';
import type { Episode } from '../types';

interface EpisodeTableProps {
  episodes: Episode[];
  isLoading?: boolean;
  onOpen?: (episode: Episode) => void;
  emptyMessage?: string;
}

export default function EpisodeTable({ episodes, isLoading = false, onOpen, emptyMessage = 'No episodes yet.' }: EpisodeTableProps): JSX.Element {
  const columnCount = onOpen ? 9 : 8;

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 70 }}>Ep #</TableCell>
              <TableCell sx={{ width: 160 }}>Title</TableCell>
              <TableCell sx={{ width: 110 }}>Air Date</TableCell>
              <TableCell sx={{ width: 260 }}>Characters</TableCell>
              <TableCell sx={{ width: 110 }}>Translations</TableCell>
              <TableCell sx={{ width: 100 }}>Summary</TableCell>
              <TableCell>Brief Summary</TableCell>
              <TableCell sx={{ width: 48 }} />
              {onOpen && <TableCell sx={{ width: 48 }} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columnCount} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow>
            ) : episodes.length === 0 ? (
              <TableRow><TableCell colSpan={columnCount} align="center"><Typography color="text.secondary" py={4}>{emptyMessage}</Typography></TableCell></TableRow>
            ) : episodes.map((ep) => (
              <ExpandableEpisodeRow key={ep.id} episode={ep} onOpen={onOpen ? () => onOpen(ep) : undefined} />
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}
