import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placeKot, getKotsByTable } from '../api/kotApi';
import { buildPlaceOrderPayload } from '../api/cartUtils';
import { getErrorMessage } from '../utils/errorHandling';
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
  const queryClient = useQueryClient();

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
      // Invalidate queries so they auto-refetch
      queryClient.invalidateQueries({ queryKey: ['kots', currentTable.id] });
      queryClient.invalidateQueries({ queryKey: ['areasAndTables'] });
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
    queryClient,
  ]);

  return { place, isPlacing, error };
}

export function useKots(tableId: string | undefined, outletId: string) {
  const query = useQuery({
    queryKey: ['kots', tableId, outletId],
    queryFn: () => getKotsByTable(tableId!, outletId),
    enabled: !!tableId && !!outletId,
  });

  return {
    kots: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
