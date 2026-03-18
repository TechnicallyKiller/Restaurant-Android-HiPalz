import { useState, useCallback, useEffect, useMemo } from 'react';
import { getSettledBills } from '../api/billApi';
import { getBillById } from '../api/billApi';
import { useAuthStore } from '../store/authStore';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';
import type { SettledBill, BillingHistoryFilters, BillPreviewData } from '../api/types';

// ----- Row types for grouped bills -----
export interface SingleBillRow {
  type: 'single';
  bill: SettledBill;
}

export interface SplitBillGroup {
  type: 'split';
  invoiceNumber: number;
  parent: SettledBill;
  variants: SettledBill[];
  totalPayable: number;
}

export type BillingRow = SingleBillRow | SplitBillGroup;

// ----- Date range presets -----
export type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

function getDateRange(preset: DatePreset): { from: number; to: number } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { from: startOfDay.getTime(), to: Date.now() };
    case 'yesterday': {
      const yd = new Date(startOfDay);
      yd.setDate(yd.getDate() - 1);
      return { from: yd.getTime(), to: startOfDay.getTime() - 1 };
    }
    case 'thisWeek': {
      const day = startOfDay.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday start
      const weekStart = new Date(startOfDay);
      weekStart.setDate(weekStart.getDate() - diff);
      return { from: weekStart.getTime(), to: Date.now() };
    }
    case 'thisMonth': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: monthStart.getTime(), to: Date.now() };
    }
    default:
      return { from: startOfDay.getTime(), to: Date.now() };
  }
}

// ----- Transform / group bills -----
function transformBills(bills: SettledBill[]): BillingRow[] {
  const grouped = new Map<number, SettledBill[]>();
  const singles: SettledBill[] = [];

  for (const bill of bills) {
    const inv = bill.billInvoiceNumber;
    if (inv == null) {
      singles.push(bill);
      continue;
    }
    const list = grouped.get(inv) ?? [];
    list.push(bill);
    grouped.set(inv, list);
  }

  const rows: BillingRow[] = [];

  for (const bill of singles) {
    rows.push({ type: 'single', bill: normalizeBill(bill) });
  }

  for (const [invoiceNumber, group] of grouped.entries()) {
    if (group.length === 1) {
      rows.push({ type: 'single', bill: normalizeBill(group[0]) });
    } else {
      const totalPayable = group.reduce((s, b) => s + (b.payable ?? b.grandTotal ?? 0), 0);
      rows.push({
        type: 'split',
        invoiceNumber,
        parent: normalizeBill(group[0]),
        variants: group.map(normalizeBill),
        totalPayable,
      });
    }
  }

  return rows;
}

function normalizeBill(bill: SettledBill): SettledBill {
  return {
    ...bill,
    paidByName: bill.paidByName?.trim() ? bill.paidByName : 'System Admin',
  };
}

// ----- Hook -----
export function useBillingHistory() {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customRange, setCustomRange] = useState<{ from: number; to: number } | null>(null);
  const [filters, setFilters] = useState<BillingHistoryFilters>({});

  // Bill detail
  const [detailBill, setDetailBill] = useState<BillPreviewData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const dateRange = useMemo(
    () => (datePreset === 'custom' && customRange ? customRange : getDateRange(datePreset)),
    [datePreset, customRange],
  );

  const fetchBills = useCallback(async (pageNum: number = 1) => {
    if (!outletId) {
      setRows([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSettledBills(
        outletId,
        dateRange.from,
        dateRange.to,
        pageNum,
        20,
        filters,
      );
      const bills = Array.isArray(data?.bills) ? data.bills : Array.isArray(data) ? (data as unknown as SettledBill[]) : [];
      setRows(transformBills(bills));
      setTotalPages(data?.totalPages ?? 1);
      setPage(data?.currentPage ?? pageNum);
    } catch (err) {
      handleApiError(err);
      setError(getErrorMessage(err));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [outletId, dateRange.from, dateRange.to, filters]);

  useEffect(() => {
    fetchBills(1);
  }, [fetchBills]);

  const nextPage = () => {
    if (page < totalPages) fetchBills(page + 1);
  };
  const prevPage = () => {
    if (page > 1) fetchBills(page - 1);
  };

  const fetchDetail = async (billId: string) => {
    setDetailLoading(true);
    try {
      const data = await getBillById(billId);
      setDetailBill(data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setDetailBill(null);

  return {
    rows,
    isLoading,
    error,
    page,
    totalPages,
    nextPage,
    prevPage,
    datePreset,
    setDatePreset,
    customRange,
    setCustomRange,
    filters,
    setFilters,
    refetch: () => fetchBills(page),
    detailBill,
    detailLoading,
    fetchDetail,
    closeDetail,
  };
}
