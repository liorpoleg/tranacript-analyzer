import { useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Alert, CircularProgress, Stack } from '@mui/material';
import { Brain, Warning } from '@phosphor-icons/react';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import { useContextualSummaries, useContextualSummary } from '@/features/episodes/services/episodes';
import { useToast } from '@/core/contexts/ToastContext';
import { usePolling } from '@/core/hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import { formatRelative } from '@/core/utils/formatDate';
import type { Episode } from '@/core/types';
import styles from './ContextualTab.module.css';

interface ContextualTabProps {
  episode: Episode;
}

export default function ContextualTab({ episode }: ContextualTabProps): JSX.Element {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: summaries = [], isLoading } = useContextualSummaries(episode.id);
  const runContextual = useContextualSummary(episode.id);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const latest = summaries[0] ?? null;

  usePolling(pendingJobId, {
    onComplete: () => {
      toast.show('Contextual summary generated!', 'success');
      setPendingJobId(null);
      qc.invalidateQueries({ queryKey: ['episode-contextual-summaries', episode.id] });
    },
    onFail: () => {
      toast.show('Contextual summary failed.', 'error');
      setPendingJobId(null);
    },
  });

  const handleRun = async (): Promise<void> => {
    if (!episode.has_translation_en && !episode.has_translation_he) {
      toast.show('Please translate the episode first.', 'warning');
      return;
    }
    try {
      const job = await runContextual.mutateAsync();
      setPendingJobId(job.id);
      toast.show('Contextual summary started.', 'info');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined;
      toast.show(message || 'Failed to start contextual summary.', 'error');
    }
  };

  return (
    <Box>
      <Box className={styles.header}>
        <Typography variant="h2" className={styles.title}>Contextual Summary</Typography>
        <AppButton
          variant="outlined"
          startIcon={<Brain size={16} />}
          onClick={handleRun}
          loading={!!pendingJobId}
          disabled={!episode.has_translation_en && !episode.has_translation_he}
        >
          {pendingJobId ? 'Generating…' : latest ? 'Re-run' : 'Generate'}
        </AppButton>
      </Box>

      {(!episode.has_translation_en && !episode.has_translation_he) && (
        <Alert severity="info" className={styles.alert}>Translate the episode first.</Alert>
      )}

      <Alert severity="info" icon={<Warning />} className={styles.alert}>
        This summary is personal to you and based on questions linked to this show/season. Re-run it after changing questions.
      </Alert>

      {isLoading ? (
        <Box className={styles.loading}><CircularProgress /></Box>
      ) : !latest ? (
        <Card className={styles.emptyCard}>
          <Typography color="text.secondary">No contextual summary yet.</Typography>
        </Card>
      ) : (
        <Card>
          <CardContent className={styles.cardContent}>
            <Typography variant="caption" color="text.secondary" className={styles.generatedAt}>
              Generated {formatRelative(latest.created_at)}
            </Typography>

            {latest.questions_snapshot?.length > 0 && (
              <Box className={styles.questionsBlock}>
                <Typography fontWeight={700} className={styles.questionsTitle}>Questions Used</Typography>
                <Stack spacing={0.75}>
                  {latest.questions_snapshot.map((q, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">{i + 1}. {q.text}</Typography>
                  ))}
                </Stack>
              </Box>
            )}

            <Typography fontWeight={700} className={styles.summaryTitle}>Summary</Typography>
            <Typography lineHeight={1.7} color="text.secondary" className={styles.summaryText}>
              {latest.summary_text}
            </Typography>
          </CardContent>
        </Card>
      )}

      {summaries.length > 1 && (
        <Box className={styles.versionsNote}>
          <Typography variant="caption" color="text.secondary">{summaries.length} total versions — showing the latest.</Typography>
        </Box>
      )}
    </Box>
  );
}
