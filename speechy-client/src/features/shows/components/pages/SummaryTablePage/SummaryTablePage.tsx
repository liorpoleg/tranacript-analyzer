import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, TextField, InputAdornment, MenuItem, Select } from '@mui/material';
import { MagnifyingGlass } from '@phosphor-icons/react';
import TablePageLayout from '@/core/components/templates/TablePageLayout/TablePageLayout';
import EpisodeTable from '@/features/shows/components/organisms/EpisodeTable/EpisodeTable';
import { useShow, useShowTree, type ShowTreeNode } from '@/features/shows/services/shows';
import { useShowEpisodes } from '@/features/episodes/services/episodes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import type { Episode } from '@/core/types';
import styles from './SummaryTablePage.module.css';

interface FlatSeason {
  id: string;
  name: string;
  depth: number;
}

function flattenTree(node: ShowTreeNode | undefined, depth = 0): FlatSeason[] {
  if (!node) return [];
  return node.children.flatMap((child) => [
    { id: child.id, name: child.name, depth },
    ...flattenTree(child, depth + 1),
  ]);
}

export default function SummaryTablePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: show } = useShow(id);
  const { data: tree } = useShowTree(id);
  // include_descendants=true: works for any node, not just a root show — a
  // season's own episodes are cross-listed to it, never to its root's
  // primary_show, so a plain primary_show-filtered fetch returns nothing
  // for a season id.
  const { data: episodes = [], isLoading } = useShowEpisodes(id, true);
  const [search, setSearch] = useState<string>('');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  usePageTitle(show ? `${show.name} — Summary Table` : 'Summary Table');

  const flatSeasons = useMemo(() => flattenTree(tree), [tree]);

  const filtered = episodes.filter((ep: Episode) => {
    const matchSearch = !search ||
      ep.title.toLowerCase().includes(search.toLowerCase()) ||
      ep.episode_number.includes(search) ||
      ep.characters.some((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    const matchSeason = seasonFilter === 'all' ||
      ep.show_memberships.some((m) => m.show === seasonFilter);
    return matchSearch && matchSeason;
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
            {flatSeasons.map((s) => (
              <MenuItem key={s.id} value={s.id} style={{ paddingLeft: 16 + s.depth * 16 }}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      }
    >
      <EpisodeTable episodes={filtered} isLoading={isLoading} emptyMessage="No episodes found." />
    </TablePageLayout>
  );
}
