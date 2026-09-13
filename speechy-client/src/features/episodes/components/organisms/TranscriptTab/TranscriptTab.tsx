import { useState } from 'react';
import { Box, Card, CardContent, Typography, Alert, Stack, Chip } from '@mui/material';
import UploadArea from '@/core/components/atoms/UploadArea/UploadArea';
import StatusBadge from '@/core/components/atoms/StatusBadge/StatusBadge';
import TranscriptViewer from '@/features/episodes/components/molecules/TranscriptViewer/TranscriptViewer';
import { useUploadTranscript, useTranscripts } from '@/features/episodes/services/episodes';
import { useToast } from '@/core/contexts/ToastContext';
import { usePolling } from '@/core/hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import type { Episode } from '@/core/types';
import styles from './TranscriptTab.module.css';

interface TranscriptTabProps {
  episode: Episode;
  onTabChange: (tab: string) => void;
}

export default function TranscriptTab({ episode, onTabChange }: TranscriptTabProps): JSX.Element {
  const toast = useToast();
  const qc = useQueryClient();
  const upload = useUploadTranscript(episode.id);
  const { data: transcripts = [] } = useTranscripts(episode.id);
  const [translateJobId, setTranslateJobId] = useState<string | null>(null);
  const [summarizeJobId, setSummarizeJobId] = useState<string | null>(null);

  const translateJob = usePolling(translateJobId, {
    onComplete: () => {
      void qc.invalidateQueries({ queryKey: ['episode-transcripts', episode.id] });
      void qc.invalidateQueries({ queryKey: ['episode', episode.id] });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onFail: () => toast.show('Translation failed.', 'error'),
  });

  const summarizeJob = usePolling(summarizeJobId, {
    onComplete: () => {
      void qc.invalidateQueries({ queryKey: ['episode-summary', episode.id] });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onFail: () => toast.show('Summary generation failed.', 'error'),
  });

  const originTranscript = transcripts.find((t) => t.language === 'origin');

  const handleDrop = async ([file]: File[]): Promise<void> => {
    if (!file) return;
    try {
      const result = await upload.mutateAsync(file);
      setTranslateJobId(result.translate_job.id);
      setSummarizeJobId(result.summarize_job.id);
      toast.show(`Transcript uploaded (${result.row_count} lines). Translation and summary started.`, 'success');
    } catch {
      toast.show('Upload failed.', 'error');
    }
  };

  const isProcessing = !!(translateJobId || summarizeJobId);

  return (
    <Box>
      <Typography variant="h2" className={styles.title}>Transcript</Typography>

      <Card className={styles.uploadCard}>
        <CardContent className={styles.uploadCardContent}>
          <Typography fontWeight={700} className={styles.uploadCardTitle}>Upload Excel transcript</Typography>
          <UploadArea
            onDrop={handleDrop}
            accept={{
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
            }}
            label={episode.has_origin_transcript ? 'Replace transcript (drop new Excel)' : 'Drop your Excel here'}
            hint=".xlsx · one row per dialogue line"
          />
          <Typography variant="caption" color="text.secondary" display="block" className={styles.uploadHint}>
            Translation and episode summary start automatically after upload.
          </Typography>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card className={styles.processingCard}>
          <CardContent className={styles.processingCardContent}>
            <Typography fontWeight={700} className={styles.processingTitle}>Processing</Typography>
            <Stack spacing={1}>
              {translateJob && (
                <Box className={styles.processingRow}>
                  <StatusBadge status={translateJob.status} />
                  <Typography variant="body2">Translation (Hebrew &amp; English)</Typography>
                  {translateJob.status === 'completed' && (
                    <Chip
                      label="View translations"
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={() => onTabChange('translate')}
                      className={styles.viewChip}
                    />
                  )}
                </Box>
              )}
              {summarizeJob && (
                <Box className={styles.processingRow}>
                  <StatusBadge status={summarizeJob.status} />
                  <Typography variant="body2">Episode summary</Typography>
                  {summarizeJob.status === 'completed' && (
                    <Chip
                      label="View summary"
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={() => onTabChange('summary')}
                      className={styles.viewChip}
                    />
                  )}
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {originTranscript && originTranscript.rows.length > 0 && (
        <TranscriptViewer title="Origin Transcript" rows={originTranscript.rows} maxHeight={480} />
      )}

      {!originTranscript && !upload.isLoading && (
        <Alert severity="info">No transcript uploaded yet. Drop an Excel file above to get started.</Alert>
      )}
    </Box>
  );
}
