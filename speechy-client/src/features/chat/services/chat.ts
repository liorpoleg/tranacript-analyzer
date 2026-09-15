import { useMutation } from '@tanstack/react-query';
import client from '@/core/services/client';
import type { ChatMessage, ChatReply } from '@/core/types';

interface ChatVariables {
  episodeIds: string[];
  messages: ChatMessage[];
}

export function useChat() {
  return useMutation<ChatReply, Error, ChatVariables>({
    mutationFn: async ({ episodeIds, messages }) => {
      const res = await client.post('/api/chat/', {
        episode_ids: episodeIds,
        messages: messages.map(({ role, content }) => ({ role, content })),
      });
      return res.data.data as ChatReply;
    },
  });
}
