import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, TextField, InputAdornment, MenuItem, Select, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress,
} from '@mui/material';
import { MagnifyingGlass } from '@phosphor-icons/react';
import TablePageLayout from '../../templates/TablePageLayout';
import ExpandableEpisodeRow from '../../organisms/ExpandableEpisodeRow';
import { useShow, useShowSeasons } from '../../api/shows';
import { useEpisodes } from '../../api/episodes';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Episode, Season } from '../../types';

export default function SummaryTablePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: show } = useShow(id);
  const { data: seasons = [] } = useShowSeasons(id);
  const { data: episodes = [], isLoading } = useEpisodes(id);
  const [search, setSearch] = useState<string>('');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  usePageTitle(show ? `${show.name} — Summary Table` : 'Summary Table');

  const filtered = episodes.filter((ep: Episode) => {
    const matchSearch = !search ||
      ep.title.toLowerCase().includes(search.toLowerCase()) ||
      ep.episode_number.includes(search) ||
      ep.characters.some((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <TablePageLayout
      title={`${show?.name ?? ''} — Summary Table`}
      subtitle="Browse transcripts and summaries for all episodes."
      filterBar={
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search episodes..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }}
          />
          <Select size="small" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value as string)} sx={{ minWidth: 160 }}>
            <MenuItem value="all">All Seasons</MenuItem>
            {seasons.map((s: Season) => <MenuItem key={s.id} value={s.id}>Season {s.number}</MenuItem>)}
          </Select>
        </Box>
      }
    >
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 90 }}>Ep #</TableCell>
                <TableCell>Title</TableCell>
                <TableCell sx={{ width: 130 }}>Air Date</TableCell>
                <TableCell sx={{ width: 220 }}>Characters</TableCell>
                <TableCell sx={{ width: 130 }}>Translations</TableCell>
                <TableCell sx={{ width: 110 }}>Summary</TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" py={4}>No episodes found.</Typography></TableCell></TableRow>
              ) : filtered.map((ep: Episode) => (
                <ExpandableEpisodeRow key={ep.id} episode={ep} />
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </TablePageLayout>
  );
}
