import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJob } from '../api/jobs';
import { TERMINAL_STATUSES } from '../constants/jobStatus';

export function usePolling(jobId, { onComplete, onFail, interval = 2000 } = {}) {
  const qc = useQueryClient();
  const { data: job } = useJob(jobId);

  useEffect(() => {
    if (!jobId) return;
    if (job && TERMINAL_STATUSES.has(job.status)) {
      if (job.status === 'completed') onComplete?.(job);
      else onFail?.(job);
      return;
    }
    const timer = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['job', jobId] });
    }, interval);
    return () => clearInterval(timer);
  }, [jobId, job?.status, qc, interval, onComplete, onFail]);

  return job;
}
