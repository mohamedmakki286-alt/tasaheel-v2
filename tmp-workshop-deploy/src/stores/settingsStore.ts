import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  toggleSound: () => void;
  toggleVibration: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      toggleVibration: () => set({ vibrationEnabled: !get().vibrationEnabled }),
    }),
    { name: 'salaba-settings' }
  )
);
