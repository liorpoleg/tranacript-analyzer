import type { JobStatus, JobType } from '../types';

export const JOB_STATUS: Record<string, JobStatus> = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped',
};

export const TERMINAL_STATUSES = new Set<JobStatus>([
  'completed',
  'failed',
  'stopped',
]);

export const STATUS_COLORS: Record<JobStatus, { bg: string; color: string }> = {
  pending: { bg: '#f3f4f6', color: '#6b7280' },
  running: { bg: '#fef3c7', color: '#92400e' },
  completed: { bg: '#dcfce7', color: '#166534' },
  failed: { bg: '#fee2e2', color: '#991b1b' },
  stopped: { bg: '#fed7aa', color: '#9a3412' },
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  translate: 'Translation',
  summarize: 'Summary',
  contextual_summary: 'Contextual Summary',
};
