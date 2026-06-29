import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';

export function useJobs(params = {}) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => client.get(API.JOBS, { params }).then((r) => r.data.data),
  });
}

export function useJob(id) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => client.get(API.JOB(id)).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useStopJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.post(API.JOB_STOP(id)).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['job', id] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
