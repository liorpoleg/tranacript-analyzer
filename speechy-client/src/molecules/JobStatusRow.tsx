import { Box, Typography, IconButton } from '@mui/material';
import { ArrowRight } from '@phosphor-icons/react';
import StatusBadge from '../atoms/StatusBadge';
import { formatRelative } from '../utils/formatDate';
import { JOB_TYPE_LABELS } from '../constants/jobStatus';
import { useNavigate } from 'react-router-dom';
import { buildRoute } from '../constants/routes';
import type { ProcessingJob } from '../types';

interface JobStatusRowProps {
  job: ProcessingJob;
}

export default function JobStatusRow({ job }: JobStatusRowProps): JSX.Element {
  const navigate = useNavigate();
  return (
    <Box
      onClick={() => navigate(buildRoute.job(job.id))}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
        borderRadius: 2, cursor: 'pointer',
        '&:hover': { bgcolor: 'background.default' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
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
