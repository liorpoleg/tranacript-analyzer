import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import type { KnowledgeFile } from '@/core/types';

// A "season" is just a Show, so knowledge is always fetched/attached by a
// single show id, whether that id is a root show or a nested node.
export function useShowKnowledge(showId: string | undefined) {
  return useQuery<KnowledgeFile[], Error>({
    queryKey: ['knowledge', showId],
    queryFn: () =>
      client.get(API.SHOW_KNOWLEDGE(showId as string)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useUploadKnowledge(showId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<KnowledgeFile, Error, File>({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return client
        .post(API.SHOW_KNOWLEDGE(showId as string), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge', showId] }),
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => client.delete(API.KNOWLEDGE(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  });
}
