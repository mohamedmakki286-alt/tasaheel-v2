import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

client.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && 'success' in data && 'data' in data) {
      return data.data !== undefined ? { ...response, data: data.data } : response;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login') {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const store = useAuthStore.getState();
        const refreshToken = store.refreshToken;
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const data = res.data.data || res.data;
        const newToken = data.token;
        const newRefreshToken = data.refreshToken;
        useAuthStore.getState().setAuth({
          token: newToken,
          refreshToken: newRefreshToken || refreshToken,
          role: store.role!,
          customer: store.customer!,
        });
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        failedQueue.forEach(({ resolve }) => resolve(newToken));
        return client(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        failedQueue = [];
      }
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    if (!error.response && (error.code === 'ECONNABORTED' || !error.code)) {
      const cfg = error.config;
      cfg.__retryCount = (cfg.__retryCount || 0) + 1;
      if (cfg.__retryCount <= 2) {
        return new Promise(resolve => setTimeout(resolve, 2000)).then(() => client(cfg));
      }
    }
    return Promise.reject(error);
  }
);

export default client;
