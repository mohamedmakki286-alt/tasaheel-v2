import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.salabaa.com/api';

function isHtmlResponse(error: any): boolean {
  const ct = error.response?.headers?.['content-type'] || '';
  return ct.includes('text/html');
}

function isNetworkError(error: any): boolean {
  return !error.response && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.code);
}

function friendlyError(error: any): string {
  if (isHtmlResponse(error)) return 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') return 'انتهت مهلة الاتصال. تحقق من اتصال الإنترنت.';
  if (!error.response) return 'لا يوجد اتصال بالإنترنت. تحقق من الشبكة وحاول مرة أخرى.';
  if (error.response?.status === 401) return 'بيانات الدخول غير صحيحة.';
  if (error.response?.status === 403) return 'الحساب غير مفعل.';
  if (error.response?.status >= 500) return 'الخادم غير متاح. حاول مرة أخرى لاحقاً.';
  const msg = error.response?.data?.message;
  if (typeof msg === 'string' && !msg.includes('<!') && !msg.includes('<html')) return msg;
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

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
    if (data && typeof data === 'object' && !Array.isArray(data) && 'success' in data && 'data' in data) {
      return data.data !== undefined ? { ...response, data: data.data } : response;
    }
    return response;
  },
  async (error) => {
    if (isHtmlResponse(error)) {
      const err = new Error(friendlyError(error));
      (err as any).isHtmlResponse = true;
      return Promise.reject(err);
    }
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
        const d = res.data;
        const inner = d && d.data ? d.data : d;
        const newToken = inner.token;
        const newRefreshToken = inner.refreshToken;
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
    if (isNetworkError(error)) {
      const cfg = error.config;
      cfg.__retryCount = (cfg.__retryCount || 0) + 1;
      if (cfg.__retryCount <= 2) {
        return new Promise(resolve => setTimeout(resolve, 2000)).then(() => client(cfg));
      }
    }
    error.friendlyMessage = friendlyError(error);
    return Promise.reject(error);
  }
);

export default client;
