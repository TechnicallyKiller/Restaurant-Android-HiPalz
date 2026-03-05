import { create } from 'zustand';
import type { Table } from '../api/types';

interface TableState {
  currentTable: Table | null;
  setCurrentTable: (table: Table | null) => void;
}

export const useTableStore = create<TableState>(set => ({
  currentTable: null,
  setCurrentTable: currentTable => set({ currentTable }),
}));
