import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, TextField, InputAdornment, MenuItem, Select } from '@mui/material';
import { MagnifyingGlass } from '@phosphor-icons/react';
import TablePageLayout from '@/core/components/templates/TablePageLayout/TablePageLayout';
import EpisodeTable from '@/features/shows/components/organisms/EpisodeTable/EpisodeTable';
import { useShow, useShowSeasons } from '@/features/shows/services/shows';
import { useEpisodes } from '@/features/episodes/services/episodes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import type { Episode, Season } from '@/core/types';
import styles from './SummaryTablePage.module.css';

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
      maxWidth="100%"
      filterBar={
        <Box className={styles.filterBar}>
          <TextField
            size="small"
            placeholder="Search episodes..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className={styles.searchField}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }}
          />
          <Select size="small" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value as string)} className={styles.seasonSelect}>
            <MenuItem value="all">All Seasons</MenuItem>
            {seasons.map((s: Season) => <MenuItem key={s.id} value={s.id}>Season {s.number}</MenuItem>)}
          </Select>
        </Box>
      }
    >
      <EpisodeTable episodes={filtered} isLoading={isLoading} emptyMessage="No episodes found." />
    </TablePageLayout>
  );
}
