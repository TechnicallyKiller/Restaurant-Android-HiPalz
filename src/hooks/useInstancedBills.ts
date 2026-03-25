import { useQuery } from '@tanstack/react-query';
import { getInstancedBills } from '../api/billApi';
import type { InstancedBillItem } from '../api/types';

export interface UseInstancedBillsOptions {
  refetchIntervalMs?: number;
}

export function useInstancedBills(outletId: string, options: UseInstancedBillsOptions = {}) {
  const { refetchIntervalMs } = options;

  const query = useQuery({
    queryKey: ['instancedBills', outletId],
    queryFn: async () => {
      const data = await getInstancedBills(outletId);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!outletId,
    refetchInterval: refetchIntervalMs && refetchIntervalMs > 0 ? refetchIntervalMs : undefined,
  });

  return {
    instances: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}
