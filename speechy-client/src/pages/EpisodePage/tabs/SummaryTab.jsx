import { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Stack, Alert, CircularProgress } from '@mui/material';
import { ArrowClockwise } from '@phosphor-icons/react';
import AppButton from '../../../atoms/AppButton';
import { useEpisodeSummary, useSummarize } from '../../../api/episodes';
import { useToast } from '../../../contexts/ToastContext';
import { usePolling } from '../../../hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../../utils/formatDate';

export default function SummaryTab({ episode }) {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: summary, isLoading } = useEpisodeSummary(episode.id);
  const summarize = useSummarize(episode.id);
  const [pendingJobId, setPendingJobId] = useState(null);

  usePolling(pendingJobId, {
    onComplete: () => {
      toast.show('Summary generated!', 'success');
      setPendingJobId(null);
      qc.invalidateQueries({ queryKey: ['episode-summary', episode.id] });
    },
    onFail: () => {
      toast.show('Summary generation failed.', 'error');
      setPendingJobId(null);
    },
  });

  const handleRun = async () => {
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h2" fontSize="1.3rem">Episode Summary</Typography>
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
        <Alert severity="info" sx={{ mb: 2 }}>Translate the episode first before generating a summary.</Alert>
      )}

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : !summary ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No summary yet. Click "Generate Summary" to start.</Typography>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Generated {formatDate(summary.created_at, 'MMM d, yyyy HH:mm')}
            </Typography>

            {summary.key_topics?.length > 0 && (
              <Box mb={2.5}>
                <Typography fontWeight={700} mb={1}>Key Topics</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {summary.key_topics.map((t, i) => (
                    <Chip key={i} label={t} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
              </Box>
            )}

            <Typography fontWeight={700} mb={1}>Summary</Typography>
            <Typography lineHeight={1.7} color="text.secondary">{summary.summary_text}</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
