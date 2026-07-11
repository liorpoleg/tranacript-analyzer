import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';
import type {
  Episode,
  Transcript,
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

export function useSeasonEpisodes(seasonId: string | undefined) {
  return useQuery<Episode[], Error>({
    queryKey: ['season-episodes', seasonId],
    queryFn: () => client.get(API.SEASON_EPISODES(seasonId as string)).then((r) => r.data.data),
    enabled: !!seasonId,
  });
}

export function useEpisode(id: string | undefined) {
  return useQuery<Episode, Error>({
    queryKey: ['episode', id],
    queryFn: () => client.get(API.EPISODE(id as string)).then((r) => r.data.data),
    enabled: !!id,
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

interface UploadResult {
  transcript_id: string;
  row_count: number;
  translate_job: ProcessingJob;
  summarize_job: ProcessingJob;
}

export function useUploadTranscript(episodeId: string) {
  const qc = useQueryClient();
  return useMutation<UploadResult, Error, File>({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return client
        .post(API.EPISODE_UPLOAD(episodeId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['episode', episodeId] });
      qc.invalidateQueries({ queryKey: ['episode-transcripts', episodeId] });
    },
  });
}

export function useSeasonUpload(seasonId: string) {
  const qc = useQueryClient();
  return useMutation<{ episodes_created: number; episode_ids: string[] }, Error, File>({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return client
        .post(API.SEASON_UPLOAD(seasonId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['episodes'] });
      qc.invalidateQueries({ queryKey: ['season-episodes', seasonId] });
    },
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

export function useTranscripts(episodeId: string | undefined) {
  return useQuery<Transcript[], Error>({
    queryKey: ['episode-transcripts', episodeId],
    queryFn: () =>
      client
        .get(API.EPISODE_TRANSCRIPTS(episodeId as string))
        .then((r) => r.data.data),
    enabled: !!episodeId,
  });
}

// Backward-compat alias
export const useEpisodeTranslations = useTranscripts;

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
