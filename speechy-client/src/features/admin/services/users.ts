import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/core/services/client';
import { API } from '@/core/constants/api';
import type { User, Organization, APIKey, UserSession, AuditLog } from '@/core/types';

export function useUsers() {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: () => client.get(API.USERS).then((r) => r.data.data),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<User, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.USERS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation<User, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.patch(API.USER(id as string), data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useOrganizations() {
  return useQuery<Organization[], Error>({
    queryKey: ['organizations'],
    queryFn: () => client.get(API.ORGANIZATIONS).then((r) => r.data.data),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation<Organization, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.ORGANIZATIONS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useUpdateOrganization(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Organization, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.patch(API.ORGANIZATION(id as string), data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useApiKeys() {
  return useQuery<APIKey[], Error>({
    queryKey: ['api-keys'],
    queryFn: () => client.get(API.API_KEYS).then((r) => r.data.data),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation<APIKey, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.API_KEYS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation<APIKey, Error, string>({
    mutationFn: (id: string) =>
      client.post(API.API_KEY_REVOKE(id)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useSessions() {
  return useQuery<UserSession[], Error>({
    queryKey: ['sessions'],
    queryFn: () => client.get(API.SESSIONS).then((r) => r.data.data),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation<UserSession, Error, string>({
    mutationFn: (id: string) =>
      client.post(API.SESSION_REVOKE(id)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useAuditLogs(params: Record<string, unknown> = {}) {
  return useQuery<AuditLog[], Error>({
    queryKey: ['audit-logs', params],
    queryFn: () => client.get(API.AUDIT_LOGS, { params }).then((r) => r.data.data),
  });
}
