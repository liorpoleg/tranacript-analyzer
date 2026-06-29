import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';

export function useEpisodes(showId) {
  return useQuery({
    queryKey: ['episodes', { showId }],
    queryFn: () =>
      client.get(API.EPISODES, { params: showId ? { show: showId } : {} }).then((r) => r.data.data),
  });
}

export function useEpisode(id) {
  return useQuery({
    queryKey: ['episode', id],
    queryFn: () => client.get(API.EPISODE(id)).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useSeasonEpisodes(seasonId) {
  return useQuery({
    queryKey: ['season-episodes', seasonId],
    queryFn: () => client.get(API.SEASON_EPISODES(seasonId)).then((r) => r.data.data),
    enabled: !!seasonId,
  });
}

export function useCreateEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.post(API.EPISODES, data).then((r) => r.data.data),
    onSuccess: (_, data) => {
      qc.invalidateQueries({ queryKey: ['episodes'] });
      if (data.season) qc.invalidateQueries({ queryKey: ['season-episodes', data.season] });
    },
  });
}

export function useUpdateEpisode(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.patch(API.EPISODE(id), data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['episode', id] }),
  });
}

export function useDeleteEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.delete(API.EPISODE(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['episodes'] });
      qc.invalidateQueries({ queryKey: ['season-episodes'] });
    },
  });
}

export function useUploadTranscript(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('file', file);
      return client.post(API.EPISODE_UPLOAD(episodeId), form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['episode', episodeId] }),
  });
}

export function useTranslate(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.post(API.EPISODE_TRANSLATE(episodeId)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useSummarize(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.post(API.EPISODE_SUMMARIZE(episodeId)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useContextualSummary(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.post(API.EPISODE_CONTEXTUAL(episodeId)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useEpisodeTranslations(episodeId) {
  return useQuery({
    queryKey: ['episode-translations', episodeId],
    queryFn: () => client.get(API.EPISODE_TRANSLATIONS(episodeId)).then((r) => r.data.data),
    enabled: !!episodeId,
  });
}

export function useEpisodeSummary(episodeId) {
  return useQuery({
    queryKey: ['episode-summary', episodeId],
    queryFn: () => client.get(API.EPISODE_SUMMARY(episodeId)).then((r) => r.data.data),
    enabled: !!episodeId,
  });
}

export function useContextualSummaries(episodeId) {
  return useQuery({
    queryKey: ['episode-contextual-summaries', episodeId],
    queryFn: () =>
      client.get(API.EPISODE_CONTEXTUAL_SUMMARIES(episodeId)).then((r) => r.data.data),
    enabled: !!episodeId,
  });
}
