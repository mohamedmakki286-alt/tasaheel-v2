import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { login as loginApi } from '../api/auth.api';
import client from '../api/client';
import type { LoginPayload } from '../types';
import { useTranslation } from 'react-i18next';

export function useAuth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, setAuth, logout: logoutStore } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (data: any) => {
      const d = data;
      const role = (d.role === 'admin' || d.role === 'super_admin') ? d.role : 'admin';
      const userData = {
        id: d.userId || d.user?.id,
        name: d.name || d.user?.name || '',
        phone: d.phone || d.user?.phone || '',
        email: d.email || d.user?.email || '',
        role,
        createdAt: d.createdAt || new Date().toISOString(),
      };
      if (!d.token) {
        toast.error(t('toast.error.noTokenInResponse'));
        return;
      }
      setAuth({ user: userData, token: d.token, refreshToken: d.refreshToken, role });
      toast.success(t('toast.success.login', { name: userData.name }));
      navigate('/', { replace: true });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || t('toast.error.loginFailed');
      toast.error(message);
    },
  });

  const logout = async () => {
    try { await client.post('/auth/logout'); } catch {}
    logoutStore();
    navigate('/login', { replace: true });
    toast.success(t('toast.success.logout'));
  };

  return {
    user,
    token,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
