import { useState } from 'react';
import { Box, Card, CardContent, Typography, Alert, CircularProgress, Chip, Stack } from '@mui/material';
import { Brain, Warning } from '@phosphor-icons/react';
import AppButton from '../../../atoms/AppButton';
import { useContextualSummaries, useContextualSummary } from '../../../api/episodes';
import { useToast } from '../../../contexts/ToastContext';
import { usePolling } from '../../../hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, formatRelative } from '../../../utils/formatDate';

export default function ContextualTab({ episode }) {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: summaries = [], isLoading } = useContextualSummaries(episode.id);
  const runContextual = useContextualSummary(episode.id);
  const [pendingJobId, setPendingJobId] = useState(null);

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

  const handleRun = async () => {
    if (!episode.has_translation_en && !episode.has_translation_he) {
      toast.show('Please translate the episode first.', 'warning');
      return;
    }
    try {
      const job = await runContextual.mutateAsync();
      setPendingJobId(job.id);
      toast.show('Contextual summary started.', 'info');
    } catch {
      toast.show('Failed to start contextual summary.', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h2" fontSize="1.3rem">Contextual Summary</Typography>
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
        <Alert severity="info" sx={{ mb: 2 }}>Translate the episode first.</Alert>
      )}

      <Alert severity="info" icon={<Warning />} sx={{ mb: 2 }}>
        This summary is personal to you and based on questions linked to this show/season. Re-run it after changing questions.
      </Alert>

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : !latest ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No contextual summary yet.</Typography>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Generated {formatRelative(latest.created_at)}
            </Typography>

            {latest.questions_snapshot?.length > 0 && (
              <Box mb={2.5}>
                <Typography fontWeight={700} mb={1}>Questions Used</Typography>
                <Stack spacing={0.75}>
                  {latest.questions_snapshot.map((q, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">{i + 1}. {q}</Typography>
                  ))}
                </Stack>
              </Box>
            )}

            <Typography fontWeight={700} mb={1}>Summary</Typography>
            <Typography lineHeight={1.7} color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {latest.summary_text}
            </Typography>
          </CardContent>
        </Card>
      )}

      {summaries.length > 1 && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">{summaries.length} total versions — showing the latest.</Typography>
        </Box>
      )}
    </Box>
  );
}
