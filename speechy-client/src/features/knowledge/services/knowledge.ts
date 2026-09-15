import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import type { KnowledgeFile } from '@/core/types';

interface UseUploadKnowledgeParams {
  showId?: string;
  seasonId?: string;
}

export function useShowKnowledge(showId: string | undefined) {
  return useQuery<KnowledgeFile[], Error>({
    queryKey: ['knowledge', 'show', showId],
    queryFn: () =>
      client.get(API.SHOW_KNOWLEDGE(showId as string)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useSeasonKnowledge(seasonId: string | undefined) {
  return useQuery<KnowledgeFile[], Error>({
    queryKey: ['knowledge', 'season', seasonId],
    queryFn: () =>
      client.get(API.SEASON_KNOWLEDGE(seasonId as string)).then((r) => r.data.data),
    enabled: !!seasonId,
  });
}

export function useUploadKnowledge({ showId, seasonId }: UseUploadKnowledgeParams) {
  const qc = useQueryClient();
  return useMutation<KnowledgeFile, Error, File>({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const url = showId
        ? API.SHOW_KNOWLEDGE(showId)
        : API.SEASON_KNOWLEDGE(seasonId as string);
      return client
        .post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((r) => r.data.data);
    },
    onSuccess: () => {
      if (showId) qc.invalidateQueries({ queryKey: ['knowledge', 'show', showId] });
      if (seasonId) qc.invalidateQueries({ queryKey: ['knowledge', 'season', seasonId] });
    },
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => client.delete(API.KNOWLEDGE(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  });
}
