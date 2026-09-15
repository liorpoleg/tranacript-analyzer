import { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, CircularProgress, Alert } from '@mui/material';
import { ArrowClockwise } from '@phosphor-icons/react';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import LanguageToggle from '@/core/components/atoms/LanguageToggle/LanguageToggle';
import JobStatusRow from '@/features/processing/components/molecules/JobStatusRow/JobStatusRow';
import TranscriptViewer from '@/features/episodes/components/molecules/TranscriptViewer/TranscriptViewer';
import { useTranscripts, useTranslate } from '@/features/episodes/services/episodes';
import { useJobs } from '@/features/processing/services/jobs';
import { useToast } from '@/core/contexts/ToastContext';
import { usePolling } from '@/core/hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import type { Episode, Language } from '@/core/types';
import styles from './TranslateTab.module.css';

interface TranslateTabProps {
  episode: Episode;
  onTabChange: (tab: string) => void;
}

const LANG_TO_TRANSCRIPT: Record<Language, 'hebrew' | 'english'> = {
  he: 'hebrew',
  en: 'english',
};

export default function TranslateTab({ episode }: TranslateTabProps): JSX.Element {
  const toast = useToast();
  const qc = useQueryClient();
  const [lang, setLang] = useState<Language>('en');
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const { data: transcripts = [], isLoading } = useTranscripts(episode.id);
  const { data: jobs = [] } = useJobs({ episode: episode.id });
  const translate = useTranslate(episode.id);

  usePolling(pendingJobId, {
    onComplete: () => {
      toast.show('Translation completed!', 'success');
      setPendingJobId(null);
      void qc.invalidateQueries({ queryKey: ['episode-transcripts', episode.id] });
      void qc.invalidateQueries({ queryKey: ['episode', episode.id] });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onFail: () => {
      toast.show('Translation failed.', 'error');
      setPendingJobId(null);
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleRerun = async (): Promise<void> => {
    try {
      const job = await translate.mutateAsync();
      setPendingJobId(job.id);
      toast.show('Translation started.', 'info');
    } catch {
      toast.show('Failed to start translation.', 'error');
    }
  };

  const transcript = transcripts.find((t) => t.language === LANG_TO_TRANSCRIPT[lang]);
  const translateJobs = jobs.filter((j) => j.job_type === 'translate');
  const isRunning = !!pendingJobId;

  return (
    <Box>
      <Box className={styles.header}>
        <Typography variant="h2" className={styles.title}>Translations</Typography>
        <Box className={styles.controls}>
          <LanguageToggle value={lang} onChange={setLang} />
          <AppButton
            variant="outlined"
            size="small"
            startIcon={<ArrowClockwise size={15} />}
            loading={isRunning}
            disabled={!episode.has_origin_transcript}
            onClick={handleRerun}
          >
            {isRunning ? 'Translating…' : 'Re-run'}
          </AppButton>
        </Box>
      </Box>

      {!episode.has_origin_transcript && (
        <Alert severity="info" className={styles.alert}>
          Upload a transcript first — go to the Transcript tab.
        </Alert>
      )}

      {isLoading ? (
        <Box className={styles.loading}><CircularProgress /></Box>
      ) : transcript && transcript.rows.length > 0 ? (
        <Box className={styles.viewerWrap}>
          <TranscriptViewer
            title={`${lang === 'en' ? 'English' : 'Hebrew'} Translation`}
            rows={transcript.rows}
            maxHeight={520}
            direction={lang === 'he' ? 'rtl' : 'ltr'}
          />
        </Box>
      ) : (
        <Card className={styles.emptyCard}>
          <Typography color="text.secondary">
            {episode.has_origin_transcript
              ? `No ${lang === 'en' ? 'English' : 'Hebrew'} translation yet.`
              : 'No transcript uploaded.'}
          </Typography>
        </Card>
      )}

      {translateJobs.length > 0 && (
        <Card>
          <CardContent className={styles.jobsCardContent}>
            <Typography fontWeight={700} className={styles.jobsTitle}>Translation Jobs</Typography>
            <Stack>
              {translateJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
