import { useMemo, useState } from 'react';
import { Box, Card, CardContent, CircularProgress, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { SlidersHorizontal } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import EmptyState from '@/core/components/atoms/EmptyState/EmptyState';
import JobStatusRow from '@/features/processing/components/molecules/JobStatusRow/JobStatusRow';
import { useJobs } from '@/features/processing/services/jobs';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import type { ProcessingJob, JobStatus } from '@/core/types';
import styles from './JobsListPage.module.css';

type StatusFilter = 'all' | JobStatus;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'stopped', label: 'Stopped' },
];

export default function JobsListPage(): JSX.Element {
  usePageTitle('Jobs');
  const { data: jobs = [], isLoading } = useJobs();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    const sorted = [...jobs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return statusFilter === 'all' ? sorted : sorted.filter((j) => j.status === statusFilter);
  }, [jobs, statusFilter]);

  return (
    <PageLayout>
      <SectionHeader
        title="Jobs"
        subtitle="Every translation, summary, and contextual-summary run across your organization."
      />

      <Card className={styles.filterCard}>
        <CardContent className={styles.filterContent}>
          <Typography variant="body2" fontWeight={700}>Status</Typography>
          <Select
            size="small"
            value={statusFilter}
            onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as StatusFilter)}
            className={styles.statusSelect}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className={styles.listContent}>
          {isLoading ? (
            <Box className={styles.centeredState}><CircularProgress size={28} /></Box>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SlidersHorizontal size={32} />}
              title="No jobs found"
              subtitle="Jobs will appear here once you translate, summarize, or run contextual summaries."
            />
          ) : (
            <Stack>
              {filtered.map((job: ProcessingJob) => <JobStatusRow key={job.id} job={job} />)}
            </Stack>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
