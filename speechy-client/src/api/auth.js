import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => client.get(API.AUTH.ME).then((r) => r.data.data),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }) =>
      client.post(API.AUTH.LOGIN, { username, password }).then((r) => r.data.data),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      client.post(API.AUTH.REGISTER, data).then((r) => r.data.data),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.post(API.AUTH.LOGOUT),
    onSuccess: () => {
      qc.clear();
      window.location.href = '/login';
    },
  });
}
