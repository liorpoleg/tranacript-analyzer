import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import type { Question } from '@/core/types';

interface UseCreateQuestionParams {
  showId?: string;
  seasonId?: string;
}

export function useShowQuestions(showId: string | undefined) {
  return useQuery<Question[], Error>({
    queryKey: ['questions', 'show', showId],
    queryFn: () =>
      client.get(API.SHOW_QUESTIONS(showId as string)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useSeasonQuestions(seasonId: string | undefined) {
  return useQuery<Question[], Error>({
    queryKey: ['questions', 'season', seasonId],
    queryFn: () =>
      client.get(API.SEASON_QUESTIONS(seasonId as string)).then((r) => r.data.data),
    enabled: !!seasonId,
  });
}

export function useCreateQuestion({ showId, seasonId }: UseCreateQuestionParams) {
  const qc = useQueryClient();
  return useMutation<Question, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) => {
      const url = showId
        ? API.SHOW_QUESTIONS(showId)
        : API.SEASON_QUESTIONS(seasonId as string);
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
  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => client.delete(API.QUESTION(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });
}
