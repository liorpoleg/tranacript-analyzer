import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';
import type { ProcessingJob } from '../types';

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
