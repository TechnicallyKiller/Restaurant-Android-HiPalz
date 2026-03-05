import { create } from 'zustand';
import type { ErrorAction, ErrorState } from '../utils/errorHandling';

interface ErrorStore extends ErrorState {
  isOffline: boolean;
  setError: (payload: Partial<ErrorState> & { isOpen: true }) => void;
  clearError: () => void;
  setOffline: (offline: boolean) => void;
}

const initialState: ErrorState = {
  isOpen: false,
  title: '',
  message: '',
  code: null,
  actions: [],
};

export const useErrorStore = create<ErrorStore>(set => ({
  ...initialState,
  isOffline: false,

  setError: payload =>
    set({
      isOpen: true,
      title: payload.title ?? 'Error',
      message: payload.message ?? 'Something went wrong',
      code: payload.code ?? null,
      actions: payload.actions ?? [{ type: 'dismiss', label: 'OK' }],
    }),

  clearError: () => set({ isOpen: false, title: '', message: '', code: null, actions: [] }),

  setOffline: isOffline => set({ isOffline }),
}));
