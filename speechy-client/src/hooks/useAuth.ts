import type { User } from '../types';
import { useMe } from '../api/auth';
import { getToken } from '../utils/tokenStorage';

export function useAuth(): { user: User | null; isLoading: boolean; isAuthenticated: boolean } {
  const hasToken = Boolean(getToken());
  const { data: user, isLoading } = useMe({ enabled: hasToken });

  if (!hasToken) {
    return { user: null, isLoading: false, isAuthenticated: false };
  }
  return { user: user ?? null, isLoading, isAuthenticated: !!user };
}
