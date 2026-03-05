import apiClient, { parseApiResponse } from './apiClient';
import type {
  Table,
  ApiResponse,
  TransferTablePayload,
  MergeTablesPayload,
} from './types';

export async function getTables(outletId: string): Promise<Table[]> {
  const res = await apiClient.get<ApiResponse<Table[]>>('/r/tables', {
    params: { outletId },
  });
  return parseApiResponse(res);
}

export async function transferTable(
  payload: TransferTablePayload,
): Promise<{ success: boolean }> {
  const res = await apiClient.post<ApiResponse<{ success: boolean }>>(
    '/r/dine-in/tables/transfer',
    payload,
  );
  return parseApiResponse(res);
}

export async function mergeTables(
  payload: MergeTablesPayload,
): Promise<{ success: boolean }> {
  const res = await apiClient.post<ApiResponse<{ success: boolean }>>(
    '/r/dine-in/tables/merge',
    payload,
  );
  return parseApiResponse(res);
}
