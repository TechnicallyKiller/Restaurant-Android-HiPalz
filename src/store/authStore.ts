import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Staff } from '../api/types';
import { setAuthToken } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';


const TOKEN_KEY = 'pos_token';
const USER_KEY = 'pos_user';

interface AuthState {
  token: string | null;
  user: Staff | null;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: Staff | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
  loginSuccess: (token: string, user: Staff) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    token: null,
    user: null,
    isLoading: false,
    error: null,

    setToken: token => {
      setAuthToken(token);
      set({ token });
    },
    setUser: user => set({ user }),
    setError: error => set({ error }),
    setLoading: isLoading => set({ isLoading }),

    hydrate: async () => {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (token) setAuthToken(token);
        const user = userJson ? (JSON.parse(userJson) as Staff) : null;
        set({ token, user });
      } catch {
        set({ token: null, user: null });
      }
    },

    loginSuccess: async (token, user) => {
      setAuthToken(token);
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);
      set({ token, user, error: null });
    },

    logout: async () => {
      setAuthToken(null);
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      set({ token: null, user: null, error: null });
    },
  })),
);

export const getStaffId = () => useAuthStore.getState().user?.id ?? '';
export const getOutletId = () => useAuthStore.getState().user?.outletId ?? '';
