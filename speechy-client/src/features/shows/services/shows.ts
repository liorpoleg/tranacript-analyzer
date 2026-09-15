import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import type { Show, ShowDetail, SearchResult } from '@/core/types';

export interface ShowTreeNode {
  id: string;
  parent_id: string | null;
  name: string;
  direct_episode_count: number;
  episode_count: number;
  children: ShowTreeNode[];
}

export function useShows() {
  return useQuery<Show[], Error>({
    queryKey: ['shows'],
    queryFn: () => client.get(API.SHOWS).then((r) => r.data.data),
  });
}

export function useShow(id: string | undefined) {
  return useQuery<ShowDetail, Error>({
    queryKey: ['show', id],
    queryFn: () => client.get(API.SHOW(id as string)).then((r) => r.data.data),
    enabled: !!id,
  });
}

// A node's direct children — each a full Show row (a "season" is just a Show
// with `parent` set), used for both the root ShowDetailPage and any nested node.
export function useShowChildren(showId: string | undefined) {
  return useQuery<Show[], Error>({
    queryKey: ['show-children', showId],
    queryFn: () =>
      client.get(API.SHOWS, { params: { parent: showId } }).then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useShowTree(showId: string | undefined, depth?: number) {
  return useQuery<ShowTreeNode, Error>({
    queryKey: ['show-tree', showId, depth],
    queryFn: () =>
      client
        .get(API.SHOW_TREE(showId as string), { params: depth ? { depth } : {} })
        .then((r) => r.data.data),
    enabled: !!showId,
  });
}

export function useCreateShow() {
  const qc = useQueryClient();
  return useMutation<Show, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.SHOWS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

export function useUpdateShow(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Show, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.patch(API.SHOW(id as string), data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shows'] });
      qc.invalidateQueries({ queryKey: ['show', id] });
    },
  });
}

export function useDeleteShow() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id: string) => client.delete(API.SHOW(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shows'] }),
  });
}

// Create a child node under `showId` — this is how a "season" is created.
export function useCreateChildShow(showId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Show, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.SHOW_CHILDREN(showId as string), data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['show-children', showId] });
      qc.invalidateQueries({ queryKey: ['show-tree', showId] });
      qc.invalidateQueries({ queryKey: ['show', showId] });
      qc.invalidateQueries({ queryKey: ['shows'] });
    },
  });
}

export function useShowSearch(showId: string | undefined, query: string) {
  const trimmed = query.trim();
  return useQuery<SearchResult[], Error>({
    queryKey: ['show-search', showId, trimmed],
    queryFn: () =>
      client
        .get(API.SHOW_SEARCH(showId as string), { params: { q: trimmed } })
        .then((r) => r.data.data),
    enabled: Boolean(showId) && trimmed.length >= 2,
    staleTime: 10_000,
  });
}
