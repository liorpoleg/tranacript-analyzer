import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => client.get(API.USERS).then((r) => r.data.data),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.post(API.USERS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.patch(API.USER(id), data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => client.get(API.ORGANIZATIONS).then((r) => r.data.data),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.post(API.ORGANIZATIONS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useUpdateOrganization(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.patch(API.ORGANIZATION(id), data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => client.get(API.API_KEYS).then((r) => r.data.data),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => client.post(API.API_KEYS, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.post(API.API_KEY_REVOKE(id)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => client.get(API.SESSIONS).then((r) => r.data.data),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.post(API.SESSION_REVOKE(id)).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useAuditLogs(params = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => client.get(API.AUDIT_LOGS, { params }).then((r) => r.data.data),
  });
}
