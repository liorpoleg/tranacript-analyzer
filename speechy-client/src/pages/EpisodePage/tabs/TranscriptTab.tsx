import { useState } from 'react';
import { Box, Card, CardContent, Typography, Alert, Stack, Divider, Chip } from '@mui/material';
import UploadArea from '../../../atoms/UploadArea';
import StatusBadge from '../../../atoms/StatusBadge';
import { useUploadTranscript, useTranscripts } from '../../../api/episodes';
import { useToast } from '../../../contexts/ToastContext';
import { usePolling } from '../../../hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import type { Episode } from '../../../types';

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
      <Typography variant="h2" fontSize="1.3rem" mb={2}>Transcript</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography fontWeight={700} mb={1.5}>Upload Excel transcript</Typography>
          <UploadArea
            onDrop={handleDrop}
            accept={{
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
            }}
            label={episode.has_origin_transcript ? 'Replace transcript (drop new Excel)' : 'Drop your Excel here'}
            hint=".xlsx · one row per dialogue line"
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={1} lineHeight={1.5}>
            Translation and episode summary start automatically after upload.
          </Typography>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography fontWeight={700} mb={1.5}>Processing</Typography>
            <Stack spacing={1}>
              {translateJob && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <StatusBadge status={translateJob.status} />
                  <Typography variant="body2">Translation (Hebrew &amp; English)</Typography>
                  {translateJob.status === 'completed' && (
                    <Chip
                      label="View translations"
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={() => onTabChange('translate')}
                      sx={{ cursor: 'pointer', ml: 'auto' }}
                    />
                  )}
                </Box>
              )}
              {summarizeJob && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <StatusBadge status={summarizeJob.status} />
                  <Typography variant="body2">Episode summary</Typography>
                  {summarizeJob.status === 'completed' && (
                    <Chip
                      label="View summary"
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={() => onTabChange('summary')}
                      sx={{ cursor: 'pointer', ml: 'auto' }}
                    />
                  )}
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {originTranscript && originTranscript.rows.length > 0 && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={700}>Origin Transcript</Typography>
              <Chip label={`${originTranscript.rows.length} lines`} size="small" />
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>
              {originTranscript.rows.map((row, i) => (
                <Box
                  key={i}
                  sx={{
                    px: 3, py: 1.25,
                    display: 'flex',
                    gap: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: 'background.default' },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ minWidth: 130, color: 'primary.main', flexShrink: 0 }}
                  >
                    {row.character_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {row.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {!originTranscript && !upload.isLoading && (
        <Alert severity="info">No transcript uploaded yet. Drop an Excel file above to get started.</Alert>
      )}
    </Box>
  );
}
