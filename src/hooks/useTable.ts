import { useQuery } from '@tanstack/react-query';
import { getDineInAreas } from '../api/areasApi';
import { getTables } from '../api/tablesApi';
import { useAuthStore } from '../store/authStore';
import type { Table } from '../api/types';

async function fetchAllTables(outletId: string): Promise<Table[]> {
  return getTables(outletId);
}

export function useTable(tableId: string | undefined) {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');

  const query = useQuery({
    queryKey: ['table', tableId, outletId],
    queryFn: () => fetchAllTables(outletId),
    enabled: !!tableId && !!outletId,
    refetchInterval: 5000,
    select: (tables) => tables.find(t => t.id === tableId) ?? null,
  });

  return {
    table: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
