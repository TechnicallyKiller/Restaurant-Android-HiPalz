import apiClient, { parseApiResponse } from './apiClient';
import type { Category, Item, ApiResponse } from './types';

export async function getCategories(outletId: string): Promise<Category[]> {
  const res = await apiClient.get<ApiResponse<Category[]>>(
    '/r/menu/base/categories',
    { params: { outletId } },
  );
  return parseApiResponse(res);
}

export async function getAreaItems(
  outletId: string,
  areaId: string,
  areaType = 'DINE_IN',
): Promise<Item[]> {
  const res = await apiClient.get<ApiResponse<Item[]>>(
    '/r/menu/areas/items',
    { params: { outletId, areaId, areaType } },
  );
  return parseApiResponse(res);
}
