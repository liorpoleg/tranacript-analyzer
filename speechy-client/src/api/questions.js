import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';

export function useShowQuestions(showId) {
  return useQuery({
    queryKey: ['questions', 'show', showId],
    queryFn: () => client.get(API.SHOW_QUESTIONS(showId)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useSeasonQuestions(seasonId) {
  return useQuery({
    queryKey: ['questions', 'season', seasonId],
    queryFn: () => client.get(API.SEASON_QUESTIONS(seasonId)).then((r) => r.data.data),
    enabled: !!seasonId,
  });
}

export function useCreateQuestion({ showId, seasonId }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      const url = showId ? API.SHOW_QUESTIONS(showId) : API.SEASON_QUESTIONS(seasonId);
      return client.post(url, data).then((r) => r.data.data);
    },
    onSuccess: () => {
      if (showId) qc.invalidateQueries({ queryKey: ['questions', 'show', showId] });
      if (seasonId) qc.invalidateQueries({ queryKey: ['questions', 'season', seasonId] });
    },
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.delete(API.QUESTION(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });
}
