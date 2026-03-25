import { useQuery } from '@tanstack/react-query';
import { getDineInAreas } from '../api/areasApi';
import { getTables } from '../api/tablesApi';
import { useAuthStore } from '../store/authStore';
import type { Area, Table } from '../api/types';
import { naturalCompare } from '../utils/naturalSort';

export interface AreaWithTables {
  area: Area;
  tables: Table[];
}

export interface UseAreasAndTablesOptions {
  refetchIntervalMs?: number;
}

async function fetchAreasAndTables(outletId: string) {
  const [areas, tables] = await Promise.all([
    getDineInAreas(outletId),
    getTables(outletId),
  ]);
  return { areas, tables };
}

function buildGrouped(areas: Area[], tables: Table[]): AreaWithTables[] {
  const areaIds = new Set(areas.map(a => a.id));
  const filtered = tables.filter(t => areaIds.has(t.areaId));
  const byArea = new Map<string, Table[]>();
  for (const t of filtered) {
    const list = byArea.get(t.areaId) ?? [];
    list.push(t);
    byArea.set(t.areaId, list);
  }
  return areas.map(area => {
    const areaTables = byArea.get(area.id) ?? [];
    areaTables.sort((a, b) => naturalCompare(a.name, b.name));
    return { area, tables: areaTables };
  });
}

export function useAreasAndTables(options: UseAreasAndTablesOptions = {}) {
  const { refetchIntervalMs } = options;
  const outletId = useAuthStore(s => s.user?.outletId ?? '');

  const query = useQuery({
    queryKey: ['areasAndTables', outletId],
    queryFn: () => fetchAreasAndTables(outletId),
    enabled: !!outletId,
    refetchInterval: refetchIntervalMs && refetchIntervalMs > 0 ? refetchIntervalMs : undefined,
    select: data => ({
      areas: data.areas,
      tables: data.tables,
      grouped: buildGrouped(data.areas, data.tables),
    }),
  });

  return {
    grouped: query.data?.grouped ?? [],
    areas: query.data?.areas ?? [],
    tables: query.data?.tables ?? [],
    isLoading: query.isLoading,
    error: query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}
