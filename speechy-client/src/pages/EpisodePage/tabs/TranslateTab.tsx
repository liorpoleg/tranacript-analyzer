import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Divider, Chip, CircularProgress, Alert,
} from '@mui/material';
import { ArrowClockwise } from '@phosphor-icons/react';
import AppButton from '../../../atoms/AppButton';
import StatusBadge from '../../../atoms/StatusBadge';
import LanguageToggle from '../../../atoms/LanguageToggle';
import JobStatusRow from '../../../molecules/JobStatusRow';
import { useTranscripts, useTranslate } from '../../../api/episodes';
import { useJobs } from '../../../api/jobs';
import { useToast } from '../../../contexts/ToastContext';
import { usePolling } from '../../../hooks/usePolling';
import { useQueryClient } from '@tanstack/react-query';
import type { Episode, Language } from '../../../types';

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h2" fontSize="1.3rem">Translations</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload a transcript first — go to the Transcript tab.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
      ) : transcript && transcript.rows.length > 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={700}>
                {lang === 'en' ? 'English' : 'Hebrew'} Translation
              </Typography>
              <Chip label={`${transcript.rows.length} lines`} size="small" />
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
              {transcript.rows.map((row, i) => (
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
                    direction: lang === 'he' ? 'rtl' : 'ltr',
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
      ) : (
        <Card sx={{ mb: 2, textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            {episode.has_origin_transcript
              ? `No ${lang === 'en' ? 'English' : 'Hebrew'} translation yet.`
              : 'No transcript uploaded.'}
          </Typography>
        </Card>
      )}

      {translateJobs.length > 0 && (
        <Card>
          <CardContent sx={{ p: 1 }}>
            <Typography fontWeight={700} px={2} pt={1.5} pb={1}>Translation Jobs</Typography>
            <Stack>
              {translateJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
