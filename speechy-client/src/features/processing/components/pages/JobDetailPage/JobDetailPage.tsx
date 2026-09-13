import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Button } from '@mui/material';
import { ArrowLeft, Stop } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import StatusBadge from '@/core/components/atoms/StatusBadge/StatusBadge';
import JobLogPanel from '@/features/processing/components/organisms/JobLogPanel/JobLogPanel';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import { useJob, useStopJob } from '@/features/processing/services/jobs';
import { usePolling } from '@/core/hooks/usePolling';
import { useToast } from '@/core/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, formatDuration } from '@/core/utils/formatDate';
import { JOB_TYPE_LABELS, TERMINAL_STATUSES } from '@/features/processing/utils/jobStatus';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import styles from './JobDetailPage.module.css';

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

  if (isLoading) return <PageLayout><Box className={styles.loading}><CircularProgress /></Box></PageLayout>;

  return (
    <PageLayout>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} className={styles.backButton}>
        Back
      </Button>

      <Box className={styles.header}>
        <Box className={styles.headerInfo}>
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

      <Grid container spacing={2} className={styles.statsGrid}>
        {([
          ['Triggered By', job!.triggered_by_username ?? '—'],
          ['Started', job!.started_at ? formatDate(job!.started_at, 'MMM d, HH:mm:ss') : '—'],
          ['Completed', job!.completed_at ? formatDate(job!.completed_at, 'MMM d, HH:mm:ss') : '—'],
          ['Duration', formatDuration(job!.duration_seconds ?? 0)],
        ] as [string, string][]).map(([label, value]) => (
          <Grid item xs={6} sm={3} key={label}>
            <Card>
              <CardContent className={styles.statCardContent}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} className={styles.statLabel}>{label}</Typography>
                <Typography fontWeight={600} className={styles.statValue}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography fontWeight={700} className={styles.logTitle}>Job Log</Typography>
      <JobLogPanel lines={job!.log_lines ?? []} />

      <AppModal open={stopModal} onClose={() => setStopModal(false)} title="Stop Job" onConfirm={handleStop} confirmLabel="Stop" confirmColor="error" loading={stop.isLoading}>
        <Typography>Are you sure you want to stop this job? Any partial results may be incomplete.</Typography>
      </AppModal>
    </PageLayout>
  );
}
