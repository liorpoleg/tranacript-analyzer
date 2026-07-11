import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';
import type { Show, Season } from '../types';

export function useShows() {
  return useQuery<Show[], Error>({
    queryKey: ['shows'],
    queryFn: () => client.get(API.SHOWS).then((r) => r.data.data),
  });
}

export function useShow(id: string | undefined) {
  return useQuery<Show, Error>({
    queryKey: ['show', id],
    queryFn: () => client.get(API.SHOW(id as string)).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateShow() {
  const qc = useQueryClient();
  return useMutation<Show, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.SHOWS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

export function useUpdateShow(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Show, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.patch(API.SHOW(id as string), data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shows'] });
      qc.invalidateQueries({ queryKey: ['show', id] });
    },
  });
}

export function useDeleteShow() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => client.delete(API.SHOW(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

export function useSeason(id: string | undefined) {
  return useQuery<Season, Error>({
    queryKey: ['season', id],
    queryFn: () => client.get(API.SEASON(id as string)).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useShowSeasons(showId: string | undefined) {
  return useQuery<Season[], Error>({
    queryKey: ['show-seasons', showId],
    queryFn: () =>
      client.get(API.SHOW_SEASONS(showId as string)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useCreateSeason(showId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Season, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client
        .post(API.SHOW_SEASONS(showId as string), data)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['show-seasons', showId] });
      qc.invalidateQueries({ queryKey: ['show', showId] });
    },
  });
}
