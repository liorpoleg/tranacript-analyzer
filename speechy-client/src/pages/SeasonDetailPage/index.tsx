import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress,
  Card, CardContent, Divider, Stack, Chip,
} from '@mui/material';
import { ArrowLeft } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import KnowledgePanel from '../../organisms/KnowledgePanel';
import QuestionsPanel from '../../organisms/QuestionsPanel';
import TwoColumnLayout from '../../templates/TwoColumnLayout';
import StatusBadge from '../../atoms/StatusBadge';
import JobStatusRow from '../../molecules/JobStatusRow';
import { useSeasonKnowledge } from '../../api/knowledge';
import { useSeasonQuestions } from '../../api/questions';
import { useSeasonJobs } from '../../api/jobs';
import { usePageTitle } from '../../hooks/usePageTitle';
import { TERMINAL_STATUSES, JOB_TYPE_LABELS } from '../../constants/jobStatus';
import type { JobStatus, JobType } from '../../types';

const STATUS_ORDER: JobStatus[] = ['running', 'pending', 'failed', 'stopped', 'completed'];

function JobsSummaryBar({ jobs }: { jobs: ReturnType<typeof useSeasonJobs>['data'] }): JSX.Element | null {
  if (!jobs || jobs.length === 0) return null;

  const counts: Partial<Record<JobStatus, number>> = {};
  for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
      {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
        <StatusBadge key={s} status={s} label={`${counts[s]} ${s}`} />
      ))}
    </Box>
  );
}

export default function SeasonDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: knowledge = [], isLoading: kLoading } = useSeasonKnowledge(id);
  const { data: questions = [], isLoading: qLoading } = useSeasonQuestions(id);
  const { data: jobs, isLoading: jobsLoading } = useSeasonJobs(id);

  usePageTitle('Season');

  const activeJobs = jobs?.filter((j) => !TERMINAL_STATUSES.has(j.status)) ?? [];
  const doneJobs = jobs?.filter((j) => TERMINAL_STATUSES.has(j.status)) ?? [];

  const byType = (type: JobType) => jobs?.filter((j) => j.job_type === type) ?? [];
  const completedByType = (type: JobType) =>
    byType(type).filter((j) => j.status === 'completed').length;

  return (
    <PageLayout>
      <Button
        startIcon={<ArrowLeft size={16} />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back
      </Button>

      <Typography variant="h2" mb={3}>Season Settings</Typography>

      <TwoColumnLayout
        left={<QuestionsPanel questions={questions} seasonId={id} isLoading={qLoading} />}
        right={<KnowledgePanel files={knowledge} seasonId={id} isLoading={kLoading} />}
      />

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h2" fontSize="1.2rem">Season Jobs</Typography>
        {jobs && jobs.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(['translate', 'summarize'] as JobType[]).map((type) => (
              <Chip
                key={type}
                size="small"
                label={`${completedByType(type)}/${byType(type).length} ${JOB_TYPE_LABELS[type]}`}
                color={completedByType(type) === byType(type).length && byType(type).length > 0 ? 'success' : 'default'}
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Box>

      {jobsLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : !jobs || jobs.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              No jobs yet. Upload a season Excel to start processing.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <JobsSummaryBar jobs={jobs} />

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
      )}
    </PageLayout>
  );
}
