import { create } from 'zustand';

interface PosState {
  selectedCategoryId: string | null;
  itemSearchQuery: string;
  selectCategory: (id: string | null) => void;
  setItemSearchQuery: (q: string) => void;
}

export const usePosStore = create<PosState>(set => ({
  selectedCategoryId: null,
  itemSearchQuery: '',
  selectCategory: selectedCategoryId => set({ selectedCategoryId }),
  setItemSearchQuery: itemSearchQuery => set({ itemSearchQuery }),
}));
