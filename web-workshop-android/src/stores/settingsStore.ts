import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  ringtoneId: string;
  toggleSound: () => void;
  toggleVibration: () => void;
  setRingtone: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      ringtoneId: 'default',
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      toggleVibration: () => set({ vibrationEnabled: !get().vibrationEnabled }),
      setRingtone: (id) => set({ ringtoneId: id }),
    }),
    { name: 'salaba-settings' }
  )
);
