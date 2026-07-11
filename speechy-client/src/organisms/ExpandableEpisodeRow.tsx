import { useState } from 'react';
import { TableRow, TableCell, Collapse, Box, Typography, Chip, IconButton } from '@mui/material';
import { CaretDown, CaretUp, ArrowRight } from '@phosphor-icons/react';
import LanguageToggle from '../atoms/LanguageToggle';
import StatusBadge from '../atoms/StatusBadge';
import { useTranscripts, useEpisodeSummary } from '../api/episodes';
import { formatDate } from '../utils/formatDate';
import type { Episode, Transcript, EpisodeSummary, Language } from '../types';

interface ExpandableEpisodeRowProps {
  episode: Episode;
  onOpen?: () => void;
}

export default function ExpandableEpisodeRow({ episode, onOpen }: ExpandableEpisodeRowProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>('en');
  const { data: transcripts = [] } = useTranscripts(expanded ? episode.id : undefined);
  const { data: summary } = useEpisodeSummary(expanded ? episode.id : undefined);

  const targetLang = lang === 'en' ? 'english' : 'hebrew';
  const transcript: Transcript | undefined =
    transcripts.find((t) => t.language === targetLang) ??
    transcripts.find((t) => t.language === 'origin');

  const transcriptText = transcript?.rows.map((r) => `${r.character_name}: ${r.text}`).join('\n') ?? '';
  const columnCount = onOpen ? 8 : 7;

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setExpanded((p) => !p)}>
        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>
          {episode.episode_number}
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{episode.title}</TableCell>
        <TableCell>{formatDate(episode.air_date)}</TableCell>
        <TableCell>
          {episode.characters.slice(0, 3).map((c, i) => (
            <Chip key={i} label={c.name} size="small" sx={{ mr: 0.5, mb: 0.25 }} />
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
        {onOpen && (
          <TableCell>
            <IconButton size="small" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpen(); }}>
              <ArrowRight size={14} />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell colSpan={columnCount} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded}>
            <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <LanguageToggle value={lang} onChange={setLang} />
              </Box>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {transcriptText ? (
                  <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Typography fontWeight={700} mb={1} variant="body2">
                      Transcript ({transcript?.language === 'origin' ? 'Original' : lang.toUpperCase()})
                    </Typography>
                    <Typography variant="body2" lineHeight={1.7} color="text.secondary"
                      sx={{ maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      {transcriptText}
                    </Typography>
                  </Box>
                ) : <Typography variant="body2" color="text.secondary">No transcript available.</Typography>}
                {summary && (
                  <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Typography fontWeight={700} mb={1} variant="body2">Summary</Typography>
                    <Typography variant="body2" lineHeight={1.7} color="text.secondary"
                      sx={{ maxHeight: 200, overflowY: 'auto', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      {(summary as EpisodeSummary).summary_text}
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
