import { useParams } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Card, CardContent, Divider, Stack, Chip,
} from '@mui/material';
import StatusBadge from '@/core/components/atoms/StatusBadge/StatusBadge';
import JobStatusRow from '@/features/processing/components/molecules/JobStatusRow/JobStatusRow';
import { useSeasonJobs } from '@/features/processing/services/jobs';
import { TERMINAL_STATUSES, JOB_TYPE_LABELS } from '@/features/processing/utils/jobStatus';
import type { JobStatus, JobType } from '@/core/types';
import styles from './SeasonJobsTab.module.css';

const STATUS_ORDER: JobStatus[] = ['running', 'pending', 'failed', 'stopped', 'completed'];

export default function JobsTab(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: jobs, isLoading } = useSeasonJobs(id);

  const activeJobs = jobs?.filter((j) => !TERMINAL_STATUSES.has(j.status)) ?? [];
  const doneJobs = jobs?.filter((j) => TERMINAL_STATUSES.has(j.status)) ?? [];

  const byType = (type: JobType) => jobs?.filter((j) => j.job_type === type) ?? [];
  const completedByType = (type: JobType) =>
    byType(type).filter((j) => j.status === 'completed').length;

  const counts: Partial<Record<JobStatus, number>> = {};
  if (jobs) for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;

  if (isLoading) {
    return <Box className={styles.loading}><CircularProgress /></Box>;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className={styles.emptyCard}>
          <Typography color="text.secondary">
            No jobs yet. Upload a season Excel to start processing.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Box className={styles.summaryRow}>
        <Box className={styles.statusChips}>
          {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
            <StatusBadge key={s} status={s} label={`${counts[s]} ${s}`} />
          ))}
        </Box>
        <Box className={styles.typeChips}>
          {(['translate', 'summarize'] as JobType[]).map((type) => (
            <Chip
              key={type}
              size="small"
              label={`${completedByType(type)}/${byType(type).length} ${JOB_TYPE_LABELS[type]}`}
              color={
                completedByType(type) === byType(type).length && byType(type).length > 0
                  ? 'success'
                  : 'default'
              }
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {activeJobs.length > 0 && (
        <Card className={styles.sectionCard}>
          <CardContent className={styles.sectionCardContent}>
            <Typography fontWeight={700} color="warning.dark" className={styles.sectionTitle}>
              In Progress ({activeJobs.length})
            </Typography>
            <Stack divider={<Divider />}>
              {activeJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
            </Stack>
          </CardContent>
        </Card>
      )}

      {doneJobs.length > 0 && (
        <Card>
          <CardContent className={styles.sectionCardContent}>
            <Typography fontWeight={700} color="text.secondary" className={styles.sectionTitle}>
              Completed / Stopped ({doneJobs.length})
            </Typography>
            <Stack divider={<Divider />}>
              {doneJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
            </Stack>
          </CardContent>
        </Card>
      )}
    </>
  );
}
