import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';

export function useShows() {
  return useQuery({
    queryKey: ['shows'],
    queryFn: () => client.get(API.SHOWS).then((r) => r.data.data),
  });
}

export function useShow(id) {
  return useQuery({
    queryKey: ['show', id],
    queryFn: () => client.get(API.SHOW(id)).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.post(API.SHOWS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

export function useUpdateShow(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.patch(API.SHOW(id), data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shows'] });
      qc.invalidateQueries({ queryKey: ['show', id] });
    },
  });
}

export function useDeleteShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.delete(API.SHOW(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

export function useShowSeasons(showId) {
  return useQuery({
    queryKey: ['show-seasons', showId],
    queryFn: () => client.get(API.SHOW_SEASONS(showId)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useCreateSeason(showId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.post(API.SHOW_SEASONS(showId), data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['show-seasons', showId] });
      qc.invalidateQueries({ queryKey: ['show', showId] });
    },
  });
}
