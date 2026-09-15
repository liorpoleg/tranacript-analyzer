import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress,
  Card, CardContent, Divider, Stack, Chip,
} from '@mui/material';
import { ArrowLeft } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import StatusBadge from '@/core/components/atoms/StatusBadge/StatusBadge';
import JobStatusRow from '@/features/processing/components/molecules/JobStatusRow/JobStatusRow';
import SeasonTabBar from '@/features/shows/components/molecules/SeasonTabBar/SeasonTabBar';
import { useSeasonJobs } from '@/features/processing/services/jobs';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { TERMINAL_STATUSES, JOB_TYPE_LABELS } from '@/features/processing/utils/jobStatus';
import type { JobStatus, JobType } from '@/core/types';
import styles from './SeasonJobsPage.module.css';

const STATUS_ORDER: JobStatus[] = ['running', 'pending', 'failed', 'stopped', 'completed'];

export default function SeasonJobsPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useSeasonJobs(id);

  usePageTitle('Season Jobs');

  const activeJobs = jobs?.filter((j) => !TERMINAL_STATUSES.has(j.status)) ?? [];
  const doneJobs = jobs?.filter((j) => TERMINAL_STATUSES.has(j.status)) ?? [];

  const byType = (type: JobType) => jobs?.filter((j) => j.job_type === type) ?? [];
  const completedByType = (type: JobType) =>
    byType(type).filter((j) => j.status === 'completed').length;

  const counts: Partial<Record<JobStatus, number>> = {};
  if (jobs) {
    for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;
  }

  return (
    <PageLayout>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} className={styles.backButton}>
        Back
      </Button>

      <Typography variant="h2" mb={2}>Season</Typography>
      <SeasonTabBar seasonId={id!} active="jobs" />

      <Box className={styles.sectionHeader}>
        <Typography variant="h2" className={styles.sectionTitle}>Processing Jobs</Typography>
        {jobs && jobs.length > 0 && (
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
        )}
      </Box>

      {jobs && jobs.length > 0 && (
        <Box className={styles.statusChips}>
          {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
            <StatusBadge key={s} status={s} label={`${counts[s]} ${s}`} />
          ))}
        </Box>
      )}

      {isLoading ? (
        <Box className={styles.loading}><CircularProgress /></Box>
      ) : !jobs || jobs.length === 0 ? (
        <Card>
          <CardContent className={styles.emptyCardContent}>
            <Typography color="text.secondary">
              No jobs yet. Upload a season Excel to start processing.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeJobs.length > 0 && (
            <Card className={styles.jobsCard}>
              <CardContent className={styles.jobsCardContent}>
                <Typography fontWeight={700} color="warning.dark" className={styles.jobsTitle}>
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
              <CardContent className={styles.jobsCardContent}>
                <Typography fontWeight={700} color="text.secondary" className={styles.jobsTitle}>
                  Completed / Stopped ({doneJobs.length})
                </Typography>
                <Stack divider={<Divider />}>
                  {doneJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
                </Stack>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageLayout>
  );
}
