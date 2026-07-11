import { useParams } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Card, CardContent, Divider, Stack, Chip,
} from '@mui/material';
import StatusBadge from '../../atoms/StatusBadge';
import JobStatusRow from '../../molecules/JobStatusRow';
import { useSeasonJobs } from '../../api/jobs';
import { TERMINAL_STATUSES, JOB_TYPE_LABELS } from '../../constants/jobStatus';
import type { JobStatus, JobType } from '../../types';

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
    return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            No jobs yet. Upload a season Excel to start processing.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
            <StatusBadge key={s} status={s} label={`${counts[s]} ${s}`} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 1 }}>
            <Typography fontWeight={700} px={2} pt={1.5} pb={1} color="warning.dark">
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
          <CardContent sx={{ p: 1 }}>
            <Typography fontWeight={700} px={2} pt={1.5} pb={1} color="text.secondary">
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
