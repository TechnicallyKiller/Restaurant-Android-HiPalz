import { create } from 'zustand';
import type { Category, Item } from '../api/types';

interface PosState {
  categories: Category[];
  items: Item[];
  filteredItems: Item[];
  selectedCategoryId: string | null;
  itemSearchQuery: string;
  isLoadingCategories: boolean;
  isLoadingItems: boolean;
  setCategories: (categories: Category[]) => void;
  setItems: (items: Item[]) => void;
  selectCategory: (id: string | null) => void;
  setItemSearchQuery: (q: string) => void;
  setLoadingCategories: (v: boolean) => void;
  setLoadingItems: (v: boolean) => void;
  recomputeFilteredItems: () => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  categories: [],
  items: [],
  filteredItems: [],
  selectedCategoryId: null,
  itemSearchQuery: '',
  isLoadingCategories: false,
  isLoadingItems: false,

  setCategories: categories => set({ categories }),
  setItems: items => {
    set({ items });
    get().recomputeFilteredItems();
  },
  selectCategory: selectedCategoryId => {
    set({ selectedCategoryId });
    get().recomputeFilteredItems();
  },
  setItemSearchQuery: itemSearchQuery => {
    set({ itemSearchQuery });
    get().recomputeFilteredItems();
  },
  setLoadingCategories: isLoadingCategories => set({ isLoadingCategories }),
  setLoadingItems: isLoadingItems => set({ isLoadingItems }),

  recomputeFilteredItems: () => {
    const { items, selectedCategoryId, itemSearchQuery } = get();
    const q = itemSearchQuery.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.description ?? '').toLowerCase().includes(q),
      );
    } else if (selectedCategoryId) {
      list = list.filter(i => i.categoryId === selectedCategoryId);
    }
    set({ filteredItems: list });
  },
}));
