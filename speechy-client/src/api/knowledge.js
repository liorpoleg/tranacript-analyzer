import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';

export function useShowKnowledge(showId) {
  return useQuery({
    queryKey: ['knowledge', 'show', showId],
    queryFn: () => client.get(API.SHOW_KNOWLEDGE(showId)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useSeasonKnowledge(seasonId) {
  return useQuery({
    queryKey: ['knowledge', 'season', seasonId],
    queryFn: () => client.get(API.SEASON_KNOWLEDGE(seasonId)).then((r) => r.data.data),
    enabled: !!seasonId,
  });
}

export function useUploadKnowledge({ showId, seasonId }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('file', file);
      const url = showId ? API.SHOW_KNOWLEDGE(showId) : API.SEASON_KNOWLEDGE(seasonId);
      return client.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } })
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
  return useMutation({
    mutationFn: (id) => client.delete(API.KNOWLEDGE(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  });
}
