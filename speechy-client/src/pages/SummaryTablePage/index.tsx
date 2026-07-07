import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, TextField, InputAdornment, MenuItem, Select, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress,
  Collapse, IconButton,
} from '@mui/material';
import { MagnifyingGlass, CaretDown, CaretUp } from '@phosphor-icons/react';
import TablePageLayout from '../../templates/TablePageLayout';
import LanguageToggle from '../../atoms/LanguageToggle';
import StatusBadge from '../../atoms/StatusBadge';
import { useShow, useShowSeasons } from '../../api/shows';
import { useEpisodes, useEpisodeTranslations, useEpisodeSummary } from '../../api/episodes';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatDate';
import type { Episode, Season, EpisodeTranslation, EpisodeSummary, Language } from '../../types';

interface EpisodeRowProps {
  episode: Episode;
}

function EpisodeRow({ episode }: EpisodeRowProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>('en');
  const { data: translations = [] } = useEpisodeTranslations(expanded ? episode.id : undefined);
  const { data: summary } = useEpisodeSummary(expanded ? episode.id : undefined);

  const translation = translations.find((t: EpisodeTranslation) => t.language === lang);
  const transcriptText = translation?.translated_rows?.map((r) => r.text).join('\n') ?? '';

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setExpanded((p) => !p)}>
        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>
          {episode.episode_number}
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{episode.title}</TableCell>
        <TableCell>{formatDate(episode.air_date)}</TableCell>
        <TableCell>
          {episode.featured_characters?.slice(0, 3).map((c: string, i: number) => (
            <Chip key={i} label={c} size="small" sx={{ mr: 0.5, mb: 0.25 }} />
          ))}
        </TableCell>
        <TableCell>
          {episode.has_translation_en && <Chip label="EN" size="small" color="primary" sx={{ mr: 0.5 }} />}
          {episode.has_translation_he && <Chip label="HE" size="small" color="secondary" />}
        </TableCell>
        <TableCell>
          <StatusBadge status={episode.has_summary ? 'completed' : 'pending'} />
        </TableCell>
        <TableCell>
          <IconButton size="small">{expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}</IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded}>
            <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <LanguageToggle value={lang} onChange={setLang} />
              </Box>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {transcriptText ? (
                  <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Typography fontWeight={700} mb={1} variant="body2">Transcript ({lang.toUpperCase()})</Typography>
                    <Typography variant="body2" lineHeight={1.7} color="text.secondary"
                      sx={{ maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      {transcriptText}
                    </Typography>
                  </Box>
                ) : <Typography variant="body2" color="text.secondary">No translation available.</Typography>}
                {summary && (
                  <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Typography fontWeight={700} mb={1} variant="body2">Summary</Typography>
                    <Typography variant="body2" lineHeight={1.7} color="text.secondary"
                      sx={{ maxHeight: 200, overflowY: 'auto', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      {summary.summary_text}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

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
      ep.featured_characters?.some((c: string) => c.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <TablePageLayout
      title={`${show?.name ?? ''} — Summary Table`}
      subtitle="Browse translated transcripts and summaries for all episodes."
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ep #</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Air Date</TableCell>
                <TableCell>Characters</TableCell>
                <TableCell>Translations</TableCell>
                <TableCell>Summary</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" py={4}>No episodes found.</Typography></TableCell></TableRow>
              ) : filtered.map((ep: Episode) => (
                <EpisodeRow key={ep.id} episode={ep} />
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </TablePageLayout>
  );
}
