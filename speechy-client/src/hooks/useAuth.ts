import type { User } from '../types';
import { useMe } from '../api/auth';

export function useAuth(): { user: User | null; isLoading: boolean; isAuthenticated: boolean } {
  const { data: user, isLoading, isError } = useMe();
  return { user: user ?? null, isLoading, isAuthenticated: !!user };
}
