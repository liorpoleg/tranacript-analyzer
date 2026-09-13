import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { getToken, removeToken } from '@/core/utils/tokenStorage';

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errData = error.response.data?.error;
      if (errData?.unauthorized) {
        window.location.href = '/unauthorized';
      } else if (errData?.missing || errData?.expired) {
        removeToken();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
