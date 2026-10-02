import { useState } from 'react';
import { Collapse, Box, Typography, Chip, IconButton } from '@mui/material';
import { CaretDown, CaretUp, ArrowRight } from '@phosphor-icons/react';
import LanguageToggle from '@/core/components/atoms/LanguageToggle/LanguageToggle';
import StatusBadge from '@/core/components/atoms/StatusBadge/StatusBadge';
import { useTranscripts, useEpisodeSummary } from '@/features/episodes/services/episodes';
import { formatDate } from '@/core/utils/formatDate';
import type { Episode, Transcript, EpisodeSummary, Language } from '@/core/types';
import styles from './ExpandableEpisodeRow.module.css';

interface ExpandableEpisodeRowProps {
  episode: Episode;
  onOpen?: () => void;
}

// Plain CSS Grid "row" rather than real <table>/<tr> markup — this renders as a
// single virtualized item (see EpisodeTable's Virtuoso), which only supports one
// DOM block per item; real <table> rows can't be split into a summary row plus a
// separate collapsible detail row the way the old two-<TableRow> version did.
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

  return (
    <Box className={styles.item}>
      <Box role="row" className={styles.row} onClick={() => setExpanded((p) => !p)}>
        <Box role="cell" className={styles.episodeNumberCell}>
          {episode.episode_number}
        </Box>
        <Box role="cell" className={styles.titleCell}>{episode.title}</Box>
        <Box role="cell">{formatDate(episode.air_date)}</Box>
        <Box role="cell">
          <Box title={episode.characters.map((c) => c.name).join(', ')} className={styles.charactersWrap}>
            {episode.characters.slice(0, 2).map((c, i) => (
              <Chip key={i} label={c.name} size="small" className={styles.characterChip} />
            ))}
            {episode.characters.length > 2 && (
              <Chip
                label={`+${episode.characters.length - 2}`}
                size="small"
                variant="outlined"
                className={styles.overflowChip}
              />
            )}
          </Box>
        </Box>
        <Box role="cell">
          {episode.has_translation_en && <Chip label="EN" size="small" color="primary" className={styles.enChip} />}
          {episode.has_translation_he && <Chip label="HE" size="small" color="secondary" />}
        </Box>
        <Box role="cell">
          <StatusBadge status={episode.has_summary ? 'completed' : 'pending'} />
        </Box>
        <Box role="cell" className={styles.briefSummaryCell}>
          {episode.brief_summary ? (
            <Typography variant="body2" color="text.primary" title={episode.brief_summary} className={styles.briefSummaryText}>
              {episode.brief_summary}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">—</Typography>
          )}
        </Box>
        <Box role="cell">
          <IconButton size="small">{expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}</IconButton>
        </Box>
        <Box role="cell">
          {onOpen && (
            <IconButton size="small" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpen(); }}>
              <ArrowRight size={14} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box className={styles.detailPanel}>
          <Box className={styles.languageRow}>
            <LanguageToggle value={lang} onChange={setLang} />
          </Box>
          <Box className={styles.detailColumns}>
            {transcriptText ? (
              <Box className={styles.detailColumn}>
                <Typography fontWeight={700} mb={1} variant="body2">
                  Transcript ({transcript?.language === 'origin' ? 'Original' : lang.toUpperCase()})
                </Typography>
                <Typography
                  variant="body2" lineHeight={1.7} color="text.secondary"
                  className={`${styles.detailBox} ${styles.transcriptBox}`}
                >
                  {transcriptText}
                </Typography>
              </Box>
            ) : <Typography variant="body2" color="text.secondary">No transcript available.</Typography>}
            {summary && (
              <Box className={styles.detailColumn}>
                <Typography fontWeight={700} mb={1} variant="body2">Summary</Typography>
                <Typography variant="body2" lineHeight={1.7} color="text.secondary" className={styles.detailBox}>
                  {(summary as EpisodeSummary).summary_text}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
