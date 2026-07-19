import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workshop } from '../types';
import type { UserRole } from './types';
import { setDemoMode as setDemoModeFlag } from './demoMode';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  workshop: Workshop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  setAuth: (data: { token: string; refreshToken?: string; role: string; workshop: Workshop }) => void;
  updateWorkshop: (workshop: Workshop) => void;
  setUser: (workshop: Workshop) => void;
  setLoading: (loading: boolean) => void;
  setDemoMode: (val: boolean) => void;
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
      isDemoMode: false,
      setAuth: (data) => {
        setDemoModeFlag(false);
        set({
          token: data.token,
          refreshToken: data.refreshToken || null,
          role: data.role as UserRole,
          workshop: data.workshop,
          isAuthenticated: true,
          isLoading: false,
          isDemoMode: false,
        });
      },
      updateWorkshop: (workshop) => set({ workshop }),
      setUser: (workshop) => set({ workshop }),
      setLoading: (loading) => set({ isLoading: loading }),
      setDemoMode: (val) => {
        setDemoModeFlag(val);
        set({ isDemoMode: val });
      },
      logout: () => {
        setDemoModeFlag(false);
        set({ token: null, refreshToken: null, role: null, workshop: null, isAuthenticated: false, isLoading: false, isDemoMode: false });
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
        isDemoMode: state.isDemoMode,
      }),
    }
  )
);
