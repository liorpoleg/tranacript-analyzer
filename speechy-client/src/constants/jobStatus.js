export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped',
};

export const TERMINAL_STATUSES = new Set([
  JOB_STATUS.COMPLETED,
  JOB_STATUS.FAILED,
  JOB_STATUS.STOPPED,
]);

export const STATUS_COLORS = {
  [JOB_STATUS.PENDING]: { bg: '#f3f4f6', color: '#6b7280' },
  [JOB_STATUS.RUNNING]: { bg: '#fef3c7', color: '#92400e' },
  [JOB_STATUS.COMPLETED]: { bg: '#dcfce7', color: '#166534' },
  [JOB_STATUS.FAILED]: { bg: '#fee2e2', color: '#991b1b' },
  [JOB_STATUS.STOPPED]: { bg: '#fed7aa', color: '#9a3412' },
};

export const JOB_TYPE_LABELS = {
  translate: 'Translation',
  summarize: 'Summary',
  contextual_summary: 'Contextual Summary',
};
