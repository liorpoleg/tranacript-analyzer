import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import { TERMINAL_STATUSES } from '@/features/processing/utils/jobStatus';
import type { ProcessingJob } from '@/core/types';

export function useJobs(params: Record<string, unknown> = {}) {
  return useQuery<ProcessingJob[], Error>({
    queryKey: ['jobs', params],
    queryFn: () => client.get(API.JOBS, { params }).then((r) => r.data.data),
  });
}

export function useJob(id: string | undefined) {
  return useQuery<ProcessingJob, Error>({
    queryKey: ['job', id],
    queryFn: () => client.get(API.JOB(id as string)).then((r) => r.data.data),
    enabled: !!id,
  });
}

// Jobs for episodes belonging to this node — a "season" is just a Show, and
// this is recursive server-side (includes descendant nodes' episodes too).
export function useShowJobs(showId: string | undefined) {
  return useQuery<ProcessingJob[], Error>({
    queryKey: ['jobs', { showId }],
    queryFn: () =>
      client.get(API.JOBS, { params: { show: showId } }).then((r) => r.data.data),
    enabled: !!showId,
    refetchInterval: (data) => {
      if (!data) return false;
      return data.some((j) => !TERMINAL_STATUSES.has(j.status)) ? 2000 : false;
    },
  });
}

export function useStopJob() {
  const qc = useQueryClient();
  return useMutation<ProcessingJob, Error, string>({
    mutationFn: (id: string) =>
      client.post(API.JOB_STOP(id)).then((r) => r.data.data),
    onSuccess: (_: ProcessingJob, id: string) => {
      qc.invalidateQueries({ queryKey: ['job', id] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
