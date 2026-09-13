import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { API } from '@/core/constants/api';
import { getToken, setToken, removeToken } from '@/core/utils/tokenStorage';
import type { User } from '@/core/types';

interface LoginVariables {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export function useMe(options?: { enabled?: boolean }) {
  return useQuery<User, Error>({
    queryKey: ['me'],
    queryFn: () => client.get(API.AUTH.ME).then((r) => r.data.data),
    retry: false,
    enabled: options?.enabled !== false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<LoginResponse, Error, LoginVariables>({
    mutationFn: ({ username, password }: LoginVariables) =>
      client.post(API.AUTH.LOGIN, { username, password }).then((r) => r.data.data),
    onSuccess: ({ token, user }: LoginResponse) => {
      setToken(token);
      qc.setQueryData(['me'], user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation<LoginResponse, Error, Record<string, unknown>>({
    mutationFn: (data: Record<string, unknown>) =>
      client.post(API.AUTH.REGISTER, data).then((r) => r.data.data),
    onSuccess: ({ token, user }: LoginResponse) => {
      setToken(token);
      qc.setQueryData(['me'], user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      removeToken();
    },
    onSuccess: () => {
      qc.clear();
      window.location.href = '/login';
    },
  });
}

const SSO_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export function loginWithSSO(
  navigate: (path: string) => void,
  onError?: (msg: string) => void,
): () => void {
  const ssoUrl =
    import.meta.env.VITE_SSO_URL ||
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/sso/mock/`;

  const popup = window.open(ssoUrl, 'sso_window', 'width=500,height=600,left=200,top=100');
  if (!popup) {
    onError?.('Popup was blocked. Please allow popups for this site.');
    return () => {};
  }

  let done = false;
  // Use a container object so inner closures always read the assigned values (avoids TDZ).
  const timers = {
    timeout: 0 as unknown as ReturnType<typeof setTimeout>,
    poll: 0 as unknown as ReturnType<typeof setInterval>,
  };

  const finish = (fn: () => void) => {
    if (done) return;
    done = true;
    window.removeEventListener('message', onMessage);
    clearTimeout(timers.timeout);
    clearInterval(timers.poll);
    if (!popup.closed) popup.close();
    fn();
  };

  const onMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) return;
    const token = event.data?.token;
    if (typeof token === 'string' && token.length > 0) {
      finish(() => {
        setToken(token);
        navigate('/dashboard');
      });
    }
  };

  window.addEventListener('message', onMessage);

  timers.timeout = setTimeout(
    () => finish(() => onError?.('SSO login timed out. Please try again.')),
    SSO_TIMEOUT_MS,
  );

  // Detect popup close without a token so the caller isn't left stuck waiting forever.
  timers.poll = setInterval(() => {
    if (popup.closed) finish(() => onError?.('SSO window was closed before sign-in completed.'));
  }, 500);

  // Return cancel function so callers can abort early.
  return () => finish(() => {});
}

export { getToken };
