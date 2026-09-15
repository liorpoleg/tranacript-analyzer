const KEY = 'speechy_token';

export const getToken = (): string | null => localStorage.getItem(KEY);
export const setToken = (token: string): void => localStorage.setItem(KEY, token);
export const removeToken = (): void => localStorage.removeItem(KEY);
