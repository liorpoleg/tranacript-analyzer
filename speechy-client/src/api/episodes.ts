import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';
import type {
  Episode,
  EpisodeTranslation,
  EpisodeSummary,
  ContextualSummary,
  ProcessingJob,
} from '../types';

interface CreateEpisodeVariables extends Record<string, unknown> {
  season?: string;
}

export function useEpisodes(showId?: string) {
  return useQuery<Episode[], Error>({
    queryKey: ['episodes', { showId }],
    queryFn: () =>
      client
        .get(API.EPISODES, { params: showId ? { show: showId } : {} })
        .then((r) => r.data.data),
  });
}

export function useEpisode(id: string | undefined) {
  return useQuery<Episode, Error>({
    queryKey: ['episode', id],
    queryFn: () => client.get(API.EPISODE(id as string)).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useSeasonEpisodes(seasonId: string | undefined) {
  return useQuery<Episode[], Error>({
    queryKey: ['season-episodes', seasonId],
    queryFn: () =>
      client.get(API.SEASON_EPISODES(seasonId as string)).then((r) => r.data.data),
    enabled: !!seasonId,
  });
}

export function useCreateEpisode() {
  const qc = useQueryClient();
  return useMutation<Episode, Error, CreateEpisodeVariables>({
    mutationFn: (data: CreateEpisodeVariables) =>
      client.post(API.EPISODES, data).then((r) => r.data.data),
    onSuccess: (_, data: CreateEpisodeVariables) => {
      qc.invalidateQueries({ queryKey: ['episodes'] });
      if (data.season) qc.invalidateQueries({ queryKey: ['season-episodes', data.season] });
    },
  });
}

export function useUpdateEpisode(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Episode, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.patch(API.EPISODE(id as string), data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['episode', id] }),
  });
}

export function useDeleteEpisode() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => client.delete(API.EPISODE(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['episodes'] });
      qc.invalidateQueries({ queryKey: ['season-episodes'] });
    },
  });
}

export function useUploadTranscript(episodeId: string) {
  const qc = useQueryClient();
  return useMutation<Episode, Error, File>({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return client
        .post(API.EPISODE_UPLOAD(episodeId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['episode', episodeId] }),
  });
}

export function useTranslate(episodeId: string) {
  const qc = useQueryClient();
  return useMutation<ProcessingJob, Error, void>({
    mutationFn: () =>
      client.post(API.EPISODE_TRANSLATE(episodeId)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useSummarize(episodeId: string) {
  const qc = useQueryClient();
  return useMutation<ProcessingJob, Error, void>({
    mutationFn: () =>
      client.post(API.EPISODE_SUMMARIZE(episodeId)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useContextualSummary(episodeId: string) {
  const qc = useQueryClient();
  return useMutation<ProcessingJob, Error, void>({
    mutationFn: () =>
      client.post(API.EPISODE_CONTEXTUAL(episodeId)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useEpisodeTranslations(episodeId: string | undefined) {
  return useQuery<EpisodeTranslation[], Error>({
    queryKey: ['episode-translations', episodeId],
    queryFn: () =>
      client
        .get(API.EPISODE_TRANSLATIONS(episodeId as string))
        .then((r) => r.data.data),
    enabled: !!episodeId,
  });
}

export function useEpisodeSummary(episodeId: string | undefined) {
  return useQuery<EpisodeSummary, Error>({
    queryKey: ['episode-summary', episodeId],
    queryFn: () =>
      client.get(API.EPISODE_SUMMARY(episodeId as string)).then((r) => r.data.data),
    enabled: !!episodeId,
  });
}

export function useContextualSummaries(episodeId: string | undefined) {
  return useQuery<ContextualSummary[], Error>({
    queryKey: ['episode-contextual-summaries', episodeId],
    queryFn: () =>
      client
        .get(API.EPISODE_CONTEXTUAL_SUMMARIES(episodeId as string))
        .then((r) => r.data.data),
    enabled: !!episodeId,
  });
}
