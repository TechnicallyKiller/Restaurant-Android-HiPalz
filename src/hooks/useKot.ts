import { useState, useCallback } from 'react';
import { placeKot, getKotsByTable } from '../api/kotApi';
import { buildPlaceOrderPayload } from '../api/cartUtils';
import { getErrorMessage, handleApiError } from '../utils/errorHandling';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { useCartStore } from '../store/cartStore';
import type { Kot } from '../api/types';

export function usePlaceKot() {
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const currentTable = useTableStore(s => s.currentTable);
  const getItemsForTable = useCartStore(s => s.getItemsForTable);
  const clearCart = useCartStore(s => s.clearCart);

  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const place = useCallback(async () => {
    if (!currentTable || !staffId || !outletId) return { success: false as const };
    const cartItems = getItemsForTable(currentTable.id);
    if (cartItems.length === 0) return { success: false as const };
    setIsPlacing(true);
    setError(null);
    try {
      const payload = buildPlaceOrderPayload(
        cartItems,
        outletId,
        currentTable.id,
        staffId,
      );
      await placeKot(payload);
      clearCart(currentTable.id);
      return { success: true as const };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      return { success: false as const, error: msg };
    } finally {
      setIsPlacing(false);
    }
  }, [
    currentTable,
    staffId,
    outletId,
    getItemsForTable,
    clearCart,
  ]);

  return { place, isPlacing, error };
}

export function useKots(tableId: string | undefined, outletId: string) {
  const [kots, setKots] = useState<Kot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKots = useCallback(async () => {
    if (!tableId || !outletId) {
      setKots([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getKotsByTable(tableId, outletId);
      setKots(data);
    } catch (err) {
      handleApiError(err);
      setKots([]);
    } finally {
      setIsLoading(false);
    }
  }, [tableId, outletId]);

  return { kots, isLoading, refetch: fetchKots };
}
