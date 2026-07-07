import { Chip } from '@mui/material';
import { STATUS_COLORS, JOB_TYPE_LABELS } from '../constants/jobStatus';
import type { JobStatus } from '../types';

interface StatusBadgeProps {
  status: JobStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const colors = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        background: colors.bg,
        color: colors.color,
        fontWeight: 700,
        fontSize: '0.7rem',
        height: 22,
        textTransform: 'capitalize',
      }}
    />
  );
}
