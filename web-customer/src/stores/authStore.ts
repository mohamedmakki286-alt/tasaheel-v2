import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '../types';

export type UserRole = 'customer' | 'workshop' | 'admin' | 'super_admin' | 'driver' | null;

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: { token: string; refreshToken?: string; role: string; customer: Customer }) => void;
  updateCustomer: (customer: Partial<Customer>) => void;
  setUser: (customer: Customer) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      role: null,
      customer: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (data) => set({
        token: data.token,
        refreshToken: data.refreshToken || null,
        role: data.role as UserRole,
        customer: data.customer,
        isAuthenticated: true,
        isLoading: false,
      }),
      updateCustomer: (data) =>
        set((state) => ({
          customer: state.customer ? { ...state.customer, ...data } : (data as Customer),
        })),
      setUser: (customer) => set({ customer }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => {
        localStorage.removeItem('salaba-customer-auth');
        set({ token: null, refreshToken: null, role: null, customer: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'salaba-customer-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        role: state.role,
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
