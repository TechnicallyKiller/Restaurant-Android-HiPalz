import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'pos_theme_dark';

interface ThemeState {
  isDark: boolean;
  setDark: (value: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,

  setDark: async (value: boolean) => {
    set({ isDark: value });
    try {
      await AsyncStorage.setItem(THEME_KEY, value ? '1' : '0');
    } catch {}
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      set({ isDark: saved !== '0' });
    } catch {
      set({ isDark: true });
    }
  },
}));
