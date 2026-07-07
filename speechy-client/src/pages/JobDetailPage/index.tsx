import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Button } from '@mui/material';
import { ArrowLeft, Stop } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import StatusBadge from '../../atoms/StatusBadge';
import JobLogPanel from '../../organisms/JobLogPanel';
import AppButton from '../../atoms/AppButton';
import AppModal from '../../atoms/AppModal';
import { useJob, useStopJob } from '../../api/jobs';
import { usePolling } from '../../hooks/usePolling';
import { useToast } from '../../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, formatDuration } from '../../utils/formatDate';
import { JOB_TYPE_LABELS, TERMINAL_STATUSES } from '../../constants/jobStatus';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { ProcessingJob } from '../../types';

export default function JobDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: job, isLoading } = useJob(id);
  const stop = useStopJob();
  const [stopModal, setStopModal] = useState<boolean>(false);

  usePageTitle(job ? `Job — ${JOB_TYPE_LABELS[job.job_type] ?? job.job_type}` : 'Job Detail');

  usePolling(job && TERMINAL_STATUSES.has(job.status) ? null : id, {
    onComplete: () => qc.invalidateQueries({ queryKey: ['job', id] }),
    interval: 2000,
  });

  const handleStop = async (): Promise<void> => {
    try {
      await stop.mutateAsync(id!);
      toast.show('Job stopped.', 'info');
      setStopModal(false);
    } catch {
      toast.show('Failed to stop job.', 'error');
    }
  };

  if (isLoading) return <PageLayout><Box sx={{ pt: 8, textAlign: 'center' }}><CircularProgress /></Box></PageLayout>;

  return (
    <PageLayout>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary' }}>
        Back
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2">{JOB_TYPE_LABELS[job!.job_type] ?? job!.job_type}</Typography>
          <Typography color="text.secondary">{job!.episode_title}</Typography>
        </Box>
        <StatusBadge status={job!.status} />
        {job!.status === 'running' && (
          <AppButton variant="outlined" color="error" startIcon={<Stop size={16} />} onClick={() => setStopModal(true)}>
            Stop
          </AppButton>
        )}
      </Box>

      <Grid container spacing={2} mb={2}>
        {([
          ['Triggered By', job!.triggered_by_username ?? '—'],
          ['Started', job!.started_at ? formatDate(job!.started_at, 'MMM d, HH:mm:ss') : '—'],
          ['Completed', job!.completed_at ? formatDate(job!.completed_at, 'MMM d, HH:mm:ss') : '—'],
          ['Duration', formatDuration(job!.duration_seconds ?? 0)],
        ] as [string, string][]).map(([label, value]) => (
          <Grid item xs={6} sm={3} key={label}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.04em" display="block">{label}</Typography>
                <Typography fontWeight={600} mt={0.5}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography fontWeight={700} mb={1}>Job Log</Typography>
      <JobLogPanel lines={job!.log_lines ?? []} />

      <AppModal open={stopModal} onClose={() => setStopModal(false)} title="Stop Job" onConfirm={handleStop} confirmLabel="Stop" confirmColor="error" loading={stop.isLoading}>
        <Typography>Are you sure you want to stop this job? Any partial results may be incomplete.</Typography>
      </AppModal>
    </PageLayout>
  );
}
