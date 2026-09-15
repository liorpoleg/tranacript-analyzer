import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import type { Question } from '@/core/types';

// A "season" is just a Show, so questions are always fetched/attached by a
// single show id, whether that id is a root show or a nested node.
export function useShowQuestions(showId: string | undefined) {
  return useQuery<Question[], Error>({
    queryKey: ['questions', showId],
    queryFn: () =>
      client.get(API.SHOW_QUESTIONS(showId as string)).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useCreateQuestion(showId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Question, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.SHOW_QUESTIONS(showId as string), data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions', showId] }),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => client.delete(API.QUESTION(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });
}
