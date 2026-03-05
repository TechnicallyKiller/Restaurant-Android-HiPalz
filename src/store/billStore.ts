import { create } from 'zustand';
import type { BillPreviewData, BillTableEntry } from '../api/types';

interface BillState {
  billsByTableId: Record<string, BillTableEntry>;
  setBillForTable: (tableId: string, data: BillPreviewData | null) => void;
  getBillForTable: (tableId: string) => BillPreviewData | null;
  getBillEntry: (tableId: string) => BillTableEntry | null;
  hasBillForTable: (tableId: string) => boolean;
  setBillSplitsForTable: (
    tableId: string,
    payload: { orderId?: string; splitVariants?: BillPreviewData[] },
  ) => void;
  setSelectedSplitBillId: (tableId: string, billId: string | null) => void;
}

export const useBillStore = create<BillState>((set, get) => ({
  billsByTableId: {},

  setBillForTable: (tableId, data) => {
    const next = { ...get().billsByTableId };
    if (data) {
      next[tableId] = { bill: data };
    } else {
      delete next[tableId];
    }
    set({ billsByTableId: next });
  },

  getBillForTable: tableId => {
    const entry = get().billsByTableId[tableId];
    if (!entry) return null;
    if (entry.selectedSplitBillId && entry.splitVariants) {
      const split = entry.splitVariants.find(b => b.id === entry.selectedSplitBillId);
      return split ?? entry.bill;
    }
    return entry.bill;
  },

  getBillEntry: tableId => get().billsByTableId[tableId] ?? null,

  hasBillForTable: tableId => {
    const entry = get().billsByTableId[tableId];
    return Boolean(entry?.bill?.id);
  },

  setBillSplitsForTable: (tableId, { orderId, splitVariants }) => {
    const entry = get().billsByTableId[tableId];
    if (!entry) return;
    set({
      billsByTableId: {
        ...get().billsByTableId,
        [tableId]: {
          ...entry,
          orderId: orderId ?? entry.orderId,
          isBillSplitted: Boolean(splitVariants?.length),
          splitVariants: splitVariants ?? entry.splitVariants,
        },
      },
    });
  },

  setSelectedSplitBillId: (tableId, billId) => {
    const entry = get().billsByTableId[tableId];
    if (!entry) return;
    set({
      billsByTableId: {
        ...get().billsByTableId,
        [tableId]: { ...entry, selectedSplitBillId: billId },
      },
    });
  },
}));
