import type { User } from '@/core/types';
import { useMe } from '@/core/services/auth';
import { getToken } from '@/core/utils/tokenStorage';

export function useAuth(): { user: User | null; isLoading: boolean; isAuthenticated: boolean } {
  const hasToken = Boolean(getToken());
  const { data: user, isLoading } = useMe({ enabled: hasToken });

  if (!hasToken) {
    return { user: null, isLoading: false, isAuthenticated: false };
  }
  return { user: user ?? null, isLoading, isAuthenticated: !!user };
}
