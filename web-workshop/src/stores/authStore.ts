import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workshop } from '../types';
import type { UserRole } from './types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  workshop: Workshop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: { token: string; refreshToken?: string; role: string; workshop: Workshop }) => void;
  updateWorkshop: (workshop: Workshop) => void;
  setUser: (workshop: Workshop) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      role: null,
      workshop: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (data) => {
        set({
          token: data.token,
          refreshToken: data.refreshToken || null,
          role: data.role as UserRole,
          workshop: data.workshop,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      updateWorkshop: (workshop) => set({ workshop }),
      setUser: (workshop) => set({ workshop }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => {
        set({ token: null, refreshToken: null, role: null, workshop: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'salaba-workshop-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        role: state.role,
        workshop: state.workshop,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
