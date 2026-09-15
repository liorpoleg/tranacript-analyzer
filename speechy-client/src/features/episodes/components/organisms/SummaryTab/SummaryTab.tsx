import { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Alert, CircularProgress } from '@mui/material';
import { ArrowClockwise } from '@phosphor-icons/react';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import { useEpisodeSummary, useSummarize } from '@/features/episodes/services/episodes';
import { useToast } from '@/core/contexts/ToastContext';
import { usePolling } from '@/core/hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/core/utils/formatDate';
import type { Episode } from '@/core/types';
import styles from './SummaryTab.module.css';

interface SummaryTabProps {
  episode: Episode;
}

export default function SummaryTab({ episode }: SummaryTabProps): JSX.Element {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: summary, isLoading } = useEpisodeSummary(episode.id);
  const summarize = useSummarize(episode.id);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  usePolling(pendingJobId, {
    onComplete: () => {
      toast.show('Summary generated!', 'success');
      setPendingJobId(null);
      void qc.invalidateQueries({ queryKey: ['episode-summary', episode.id] });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onFail: () => {
      toast.show('Summary generation failed.', 'error');
      setPendingJobId(null);
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleRun = async (): Promise<void> => {
    if (!episode.has_translation_en && !episode.has_translation_he) {
      toast.show('Please translate the episode first.', 'warning');
      return;
    }
    try {
      const job = await summarize.mutateAsync();
      setPendingJobId(job.id);
      toast.show('Summary started.', 'info');
    } catch {
      toast.show('Failed to start summary.', 'error');
    }
  };

  return (
    <Box>
      <Box className={styles.header}>
        <Typography variant="h2" className={styles.title}>Episode Summary</Typography>
        <AppButton
          variant="outlined"
          startIcon={<ArrowClockwise size={16} />}
          onClick={handleRun}
          loading={!!pendingJobId}
          disabled={!episode.has_translation_en && !episode.has_translation_he}
        >
          {pendingJobId ? 'Generating…' : summary ? 'Re-run Summary' : 'Generate Summary'}
        </AppButton>
      </Box>

      {(!episode.has_translation_en && !episode.has_translation_he) && (
        <Alert severity="info" className={styles.alert}>Translate the episode first before generating a summary.</Alert>
      )}

      {isLoading ? (
        <Box className={styles.loading}><CircularProgress /></Box>
      ) : !summary ? (
        <Card className={styles.emptyCard}>
          <Typography color="text.secondary">No summary yet. Click "Generate Summary" to start.</Typography>
        </Card>
      ) : (
        <Card>
          <CardContent className={styles.cardContent}>
            <Typography variant="caption" color="text.secondary" className={styles.generatedAt}>
              Generated {formatDate(summary.created_at, 'MMM d, yyyy HH:mm')}
            </Typography>

            {summary.key_topics?.length > 0 && (
              <Box className={styles.topicsBlock}>
                <Typography fontWeight={700} className={styles.topicsTitle}>Key Topics</Typography>
                <Box className={styles.topicsChips}>
                  {summary.key_topics.map((t, i) => (
                    <Chip key={i} label={t} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
              </Box>
            )}

            <Typography fontWeight={700} className={styles.summaryTitle}>Summary</Typography>
            <Typography lineHeight={1.7} color="text.secondary">{summary.summary_text}</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
