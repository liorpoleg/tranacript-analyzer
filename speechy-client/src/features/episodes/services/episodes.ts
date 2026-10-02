import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import type {
  Episode,
  Transcript,
  EpisodeSummary,
  ContextualSummary,
  ProcessingJob,
} from '@/core/types';

export function useEpisodes(showId?: string) {
  return useQuery<Episode[], Error>({
    queryKey: ['episodes', { showId }],
    queryFn: () =>
      client
        .get(API.EPISODES, { params: showId ? { show: showId } : {} })
        .then((r) => r.data.data),
  });
}

// A node's cross-listed episodes (via the Episode<->Show M2M). Pass
// includeDescendants to also pull in every descendant node's episodes.
export function useShowEpisodes(showId: string | undefined, includeDescendants = false) {
  return useQuery<Episode[], Error>({
    queryKey: ['show-episodes', showId, includeDescendants],
    queryFn: () =>
      client
        .get(API.SHOW_EPISODES(showId as string), {
          params: includeDescendants ? { include_descendants: 'true' } : {},
        })
        .then((r) => r.data.data),
    enabled: !!showId,
  });
}

interface EpisodesPage {
  episodes: Episode[];
  count: number;
  next: string | null;
}

// Paginated/infinite-scroll version of useShowEpisodes, for the actual episode
// table (ShowDetailPage/SeasonAccordion) — a show can have up to ~1M episodes,
// so the table loads them in chunks as the user scrolls rather than all at once.
// Pagination is opt-in server-side (triggered by page/page_size being sent),
// so this is a separate hook from useShowEpisodes rather than a parameter on it —
// the latter stays the "give me the full flat list" hook for selector UIs (chat).
export function useShowEpisodesInfinite(showId: string | undefined, pageSize = 75) {
  return useInfiniteQuery<EpisodesPage, Error>({
    queryKey: ['show-episodes-infinite', showId, pageSize],
    queryFn: async ({ pageParam = 1 }) => {
      const r = await client.get(API.SHOW_EPISODES(showId as string), {
        params: { page: pageParam, page_size: pageSize },
      });
      return { episodes: r.data.data, count: r.data.pagination.count, next: r.data.pagination.next };
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
    enabled: !!showId,
  });
}

export function useEpisode(id: string | undefined) {
  return useQuery<Episode, Error>({
    queryKey: ['episode', id],
    queryFn: () => client.get(API.EPISODE(id as string)).then((r) => r.data.data),
    enabled: !!id,
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
      qc.invalidateQueries({ queryKey: ['show-episodes'] });
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

export function useShowUpload(showId: string) {
  const qc = useQueryClient();
  return useMutation<{ episodes_created: number; episode_ids: string[] }, Error, File>({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return client
        .post(API.SHOW_UPLOAD(showId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['episodes'] });
      qc.invalidateQueries({ queryKey: ['show-episodes', showId] });
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
