import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import type { UserRole } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: { user: User; token: string; refreshToken?: string; role: string }) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (data) => set({
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken || null,
        role: data.role as UserRole,
        isAuthenticated: true,
        isLoading: false,
      }),
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null, token: null, refreshToken: null, role: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: 'salaba-admin-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
