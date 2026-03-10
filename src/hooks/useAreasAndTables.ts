import { useState, useCallback, useEffect } from 'react';
import { getDineInAreas } from '../api/areasApi';
import { getTables } from '../api/tablesApi';
import { useAuthStore } from '../store/authStore';
import type { Area, Table } from '../api/types';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';

export interface AreaWithTables {
  area: Area;
  tables: Table[];
}

export interface UseAreasAndTablesOptions {
  refetchIntervalMs?: number;
}

export function useAreasAndTables(options: UseAreasAndTablesOptions = {}) {
  const { refetchIntervalMs } = options;
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [grouped, setGrouped] = useState<AreaWithTables[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!outletId) {
      setGrouped([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [areasRes, tablesRes] = await Promise.all([
        getDineInAreas(outletId),
        getTables(outletId),
      ]);
      setAreas(areasRes);
      setTables(tablesRes);
      const areaIds = new Set(areasRes.map(a => a.id));
      const filtered = tablesRes.filter(t => areaIds.has(t.areaId));
      const byArea = new Map<string, Table[]>();
      for (const t of filtered) {
        const list = byArea.get(t.areaId) ?? [];
        list.push(t);
        byArea.set(t.areaId, list);
      }
      const groupedRes: AreaWithTables[] = areasRes.map(area => ({
        area,
        tables: byArea.get(area.id) ?? [],
      }));
      setGrouped(groupedRes);
    } catch (err) {
      handleApiError(err);
      setError(getErrorMessage(err));
      setGrouped([]);
    } finally {
      setIsLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refetchIntervalMs == null || refetchIntervalMs <= 0) return;
    const id = setInterval(fetchData, refetchIntervalMs);
    return () => clearInterval(id);
  }, [fetchData, refetchIntervalMs]);

  return { grouped, areas, tables, isLoading, error, refetch: fetchData };
}
