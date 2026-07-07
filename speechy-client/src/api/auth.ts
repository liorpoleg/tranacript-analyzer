import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '../constants/api';
import type { User } from '../types';

interface LoginVariables {
  username: string;
  password: string;
}

export function useMe() {
  return useQuery<User, Error>({
    queryKey: ['me'],
    queryFn: () => client.get(API.AUTH.ME).then((r) => r.data.data),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<User, Error, LoginVariables>({
    mutationFn: ({ username, password }: LoginVariables) =>
      client.post(API.AUTH.LOGIN, { username, password }).then((r) => r.data.data),
    onSuccess: (user: User) => qc.setQueryData(['me'], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation<User, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.AUTH.REGISTER, data).then((r) => r.data.data),
    onSuccess: (user: User) => qc.setQueryData(['me'], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, void>({
    mutationFn: () => client.post(API.AUTH.LOGOUT),
    onSuccess: () => {
      qc.clear();
      window.location.href = '/login';
    },
  });
}
