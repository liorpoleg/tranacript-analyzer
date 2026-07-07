import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJob } from '../api/jobs';
import { TERMINAL_STATUSES } from '../constants/jobStatus';
import type { ProcessingJob } from '../types';

interface UsePollingOptions {
  onComplete?: (job: ProcessingJob) => void;
  onFail?: (job: ProcessingJob) => void;
  interval?: number;
}

export function usePolling(
  jobId: string | null | undefined,
  { onComplete, onFail, interval = 2000 }: UsePollingOptions = {},
): ProcessingJob | undefined {
  const qc = useQueryClient();
  const { data: job } = useJob(jobId ?? undefined);

  // Keep callbacks in refs so they never appear in the effect deps.
  // Without this, each render creates a new function reference, which
  // re-triggers the effect, clears the interval, and prevents polling.
  const onCompleteRef = useRef(onComplete);
  const onFailRef = useRef(onFail);
  onCompleteRef.current = onComplete;
  onFailRef.current = onFail;

  // Prevent calling the callback more than once per job run.
  const firedRef = useRef(false);

  useEffect(() => {
    if (!jobId) {
      firedRef.current = false;
      return;
    }

    if (job && TERMINAL_STATUSES.has(job.status)) {
      if (!firedRef.current) {
        firedRef.current = true;
        if (job.status === 'completed') onCompleteRef.current?.(job);
        else onFailRef.current?.(job);
      }
      return;
    }

    // Job is still running — poll the individual job and the list.
    firedRef.current = false;
    const timer = setInterval(() => {
      void qc.invalidateQueries({ queryKey: ['job', jobId] });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    }, interval);
    return () => clearInterval(timer);
  }, [jobId, job?.status, qc, interval]);

  return job;
}
