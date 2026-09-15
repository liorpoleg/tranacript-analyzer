import { Chip } from '@mui/material';
import { STATUS_COLORS, JOB_TYPE_LABELS } from '@/features/processing/utils/jobStatus';
import type { JobStatus } from '@/core/types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: JobStatus;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps): JSX.Element {
  const colors = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <Chip
      label={label ?? status}
      size="small"
      className={styles.badge}
      style={{ '--badge-bg': colors.bg, '--badge-color': colors.color } as React.CSSProperties}
    />
  );
}
