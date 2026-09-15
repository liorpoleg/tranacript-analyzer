import { Box, Typography, IconButton } from '@mui/material';
import { ArrowRight } from '@phosphor-icons/react';
import StatusBadge from '@/core/components/atoms/StatusBadge/StatusBadge';
import { formatRelative } from '@/core/utils/formatDate';
import { JOB_TYPE_LABELS } from '@/features/processing/utils/jobStatus';
import { useNavigate } from 'react-router-dom';
import { buildRoute } from '@/core/constants/routes';
import type { ProcessingJob } from '@/core/types';
import styles from './JobStatusRow.module.css';

interface JobStatusRowProps {
  job: ProcessingJob;
}

export default function JobStatusRow({ job }: JobStatusRowProps): JSX.Element {
  const navigate = useNavigate();
  return (
    <Box onClick={() => navigate(buildRoute.job(job.id))} className={styles.row}>
      <Box className={styles.info}>
        <Typography fontWeight={600} noWrap>{job.episode_title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {JOB_TYPE_LABELS[job.job_type] ?? job.job_type} · {formatRelative(job.created_at)}
        </Typography>
      </Box>
      <StatusBadge status={job.status} />
      <IconButton size="small"><ArrowRight size={14} /></IconButton>
    </Box>
  );
}
