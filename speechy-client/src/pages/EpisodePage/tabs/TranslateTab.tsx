import { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Alert } from '@mui/material';
import { Play } from '@phosphor-icons/react';
import UploadArea from '../../../atoms/UploadArea';
import AppButton from '../../../atoms/AppButton';
import JobStatusRow from '../../../molecules/JobStatusRow';
import LanguageToggle from '../../../atoms/LanguageToggle';
import TwoColumnLayout from '../../../templates/TwoColumnLayout';
import { useUploadTranscript, useTranslate, useEpisodeTranslations } from '../../../api/episodes';
import { useJobs } from '../../../api/jobs';
import { useToast } from '../../../contexts/ToastContext';
import { usePolling } from '../../../hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import type { Episode, ProcessingJob } from '../../../types';

interface TranslationHistoryProps {
  episodeId: string;
  jobs: ProcessingJob[];
}

function TranslationHistory({ episodeId, jobs }: TranslationHistoryProps): JSX.Element {
  return (
    <Card>
      <CardContent sx={{ p: 1 }}>
        <Typography fontWeight={700} px={2} pt={1.5} pb={1}>Translation Jobs</Typography>
        <Stack>
          {jobs.filter((j) => j.job_type === 'translate').map((job) => (
            <JobStatusRow key={job.id} job={job} />
          ))}
          {jobs.filter((j) => j.job_type === 'translate').length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>No translation jobs yet.</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

interface TranslateTabProps {
  episode: Episode;
}

export default function TranslateTab({ episode }: TranslateTabProps): JSX.Element {
  const toast = useToast();
  const qc = useQueryClient();
  const upload = useUploadTranscript(episode.id);
  const translate = useTranslate(episode.id);
  const { data: jobs = [] } = useJobs({ episode: episode.id });
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  usePolling(pendingJobId, {
    onComplete: () => {
      toast.show('Translation completed!', 'success');
      setPendingJobId(null);
      void qc.invalidateQueries({ queryKey: ['episode', episode.id] });
      void qc.invalidateQueries({ queryKey: ['episode-translations', episode.id] });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onFail: () => {
      toast.show('Translation failed.', 'error');
      setPendingJobId(null);
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleDrop = async ([file]: File[]): Promise<void> => {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      toast.show('Transcript uploaded!', 'success');
    } catch {
      toast.show('Upload failed.', 'error');
    }
  };

  const handleTranslate = async (): Promise<void> => {
    try {
      const job = await translate.mutateAsync();
      setPendingJobId(job.id);
      toast.show('Translation started.', 'info');
    } catch {
      toast.show('Failed to start translation.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h2" fontSize="1.3rem" mb={2}>Translate Episode</Typography>
      <TwoColumnLayout
        left={
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={700} mb={1}>Upload transcript</Typography>
              <UploadArea
                onDrop={handleDrop}
                accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }}
                label="Drop your Excel here"
                hint=".xlsx, .xls"
              />
              {episode.raw_excel_path && (
                <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>Transcript uploaded</Alert>
              )}
              <AppButton
                variant="contained"
                fullWidth
                sx={{ mt: 2.5 }}
                startIcon={<Play size={16} />}
                onClick={handleTranslate}
                loading={translate.isLoading || !!pendingJobId}
                disabled={!episode.raw_excel_path}
              >
                {pendingJobId ? 'Translating…' : 'Start Translation'}
              </AppButton>
              <Typography variant="caption" color="text.secondary" display="block" mt={1.5} lineHeight={1.5}>
                Both Hebrew and English translations are generated simultaneously. Incremental — existing rows are skipped.
              </Typography>
            </CardContent>
          </Card>
        }
        right={<TranslationHistory episodeId={episode.id} jobs={jobs} />}
      />
    </Box>
  );
}
