import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { setupWorkshopDemoInterceptor, getDemoMode } from '../stores/demoMode';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({ baseURL: API_BASE, timeout: 60000 });

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  const token = useAuthStore.getState().token;
  const isPublicCatalogRequest = config.url === '/categories'
    || config.url?.startsWith('/service-catalog');
  if (token && !isPublicCatalogRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

apiClient.interceptors.response.use(
  (response) => {
    console.log("RAW RESPONSE", response);
    const d = response.data;
    if (d && 'success' in d && 'data' in d) {
      response.data = d.data;
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
          return apiClient(originalRequest);
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
          workshop: store.workshop!,
        });
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        failedQueue.forEach(({ resolve }) => resolve(newToken));
        return apiClient(originalRequest);
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
        return new Promise(resolve => setTimeout(resolve, 2000)).then(() => apiClient(cfg));
      }
    }
    return Promise.reject(error);
  }
);

setupWorkshopDemoInterceptor(apiClient);

export default apiClient;
