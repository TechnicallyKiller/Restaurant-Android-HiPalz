import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSettledBills, getBillById } from '../api/billApi';
import { useAuthStore } from '../store/authStore';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';
import type { SettledBill, BillingHistoryFilters, BillPreviewData } from '../api/types';
import { getRangeForPreset, DEFAULT_BILLING_START_TIME } from '../utils/dateUtils';

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
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from: number; to: number }>(
    getRangeForPreset('today', DEFAULT_BILLING_START_TIME),
  );
  const [filters, setFilters] = useState<BillingHistoryFilters>({});

  // Bill detail
  const [detailBill, setDetailBill] = useState<BillPreviewData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const query = useQuery({
    queryKey: ['billingHistory', outletId, dateRange.from, dateRange.to, page, filters],
    queryFn: async () => {
      const data = await getSettledBills(
        outletId,
        dateRange.from,
        dateRange.to,
        page,
        20,
        filters,
      );
      const bills = Array.isArray(data?.bills)
        ? data.bills
        : Array.isArray(data)
          ? (data as unknown as SettledBill[])
          : [];
      return {
        rows: transformBills(bills),
        totalPages: data?.totalPages ?? 1,
        currentPage: data?.currentPage ?? page,
      };
    },
    enabled: !!outletId,
    placeholderData: (prev: any) => prev,
  });

  const rows = query.data?.rows ?? [];
  const totalPages = query.data?.totalPages ?? 1;

  const nextPage = () => {
    if (page < totalPages) setPage(p => p + 1);
  };
  const prevPage = () => {
    if (page > 1) setPage(p => p - 1);
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
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
    page,
    totalPages,
    nextPage,
    prevPage,
    dateRange,
    setDateRange,
    filters,
    setFilters,
    refetch: query.refetch,
    detailBill,
    detailLoading,
    fetchDetail,
    closeDetail,
  };
}
