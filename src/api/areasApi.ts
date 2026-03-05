import apiClient, { parseApiResponse } from './apiClient';
import type { Area, ApiResponse } from './types';

export async function getDineInAreas(outletId: string): Promise<Area[]> {
  const res = await apiClient.get<ApiResponse<Area[]>>('/r/areas/dine-in', {
    params: { outletId, areaType: 'DINE_IN' },
  });
  return parseApiResponse(res);
}
