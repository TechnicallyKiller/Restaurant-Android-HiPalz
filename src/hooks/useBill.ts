import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  billPreview,
  billGenerate,
  getBillByTable,
  payBill,
  getPaymentModes,
} from '../api/billApi';
import { getErrorMessage, handleApiError } from '../utils/errorHandling';
import { useAuthStore } from '../store/authStore';
import { useBillStore } from '../store/billStore';
import type { BillPreviewData, BillPayPayload, PaymentModeItem } from '../api/types';

export function useBillPreview(tableId: string | undefined) {
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const setBillForTable = useBillStore(s => s.setBillForTable);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!tableId || !staffId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await billPreview(tableId, staffId);
      setBillForTable(tableId, data);
      return data;
    } catch (err) {
      handleApiError(err);
      setError(getErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableId, staffId, setBillForTable]);

  return { fetchPreview, isLoading, error };
}

export function useBillGenerate(tableId: string | undefined) {
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const setBillForTable = useBillStore(s => s.setBillForTable);
  const queryClient = useQueryClient();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (): Promise<BillPreviewData | null> => {
    if (!tableId || !staffId) return null;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await billGenerate(tableId, staffId);
      setBillForTable(tableId, data);
      queryClient.invalidateQueries({ queryKey: ['bill', tableId] });
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      return data;
    } catch (err) {
      handleApiError(err);
      setError(getErrorMessage(err));
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [tableId, staffId, setBillForTable, queryClient]);

  return { generate, isGenerating, error };
}

export function useBillByTable(tableId: string | undefined) {
  const getBillForTable = useBillStore(s => s.getBillForTable);
  const bill = tableId ? getBillForTable(tableId) : null;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const setBillForTable = useBillStore(s => s.setBillForTable);

  const refresh = useCallback(async () => {
    if (!tableId) return;
    setIsRefreshing(true);
    try {
      const data = await getBillByTable(tableId);
      if (data) setBillForTable(tableId, data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [tableId, setBillForTable]);

  return { bill, refresh, isRefreshing };
}

export function usePayBill() {
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async (payload: Omit<BillPayPayload, 'staffId'>) => {
      setIsPaying(true);
      setError(null);
      try {
        await payBill({ ...payload, staffId });
        return { success: true as const };
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        return { success: false as const, error: msg };
      } finally {
        setIsPaying(false);
      }
    },
    [staffId],
  );

  return { pay, isPaying, error };
}

export function usePaymentModes() {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');

  const query = useQuery({
    queryKey: ['paymentModes', outletId],
    queryFn: () => getPaymentModes(outletId),
    enabled: !!outletId,
  });

  return {
    modes: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
