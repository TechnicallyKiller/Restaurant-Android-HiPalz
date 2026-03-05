import apiClient, { parseApiResponse } from './apiClient';
import type {
  PlaceOrderPayload,
  Kot,
  ApiResponse,
  TransferKotPayload,
  DeleteKotItemPayload,
} from './types';

export async function placeKot(
  payload: PlaceOrderPayload,
): Promise<{ success: boolean }> {
  const res = await apiClient.post<ApiResponse<{ success: boolean }>>(
    '/r/dine-in/kots/place',
    payload,
  );
  return parseApiResponse(res);
}

export async function getKotsByTable(
  tableId: string,
  outletId: string,
): Promise<Kot[]> {
  const res = await apiClient.get<ApiResponse<Kot[]>>(
    `/r/dine-in/kots/order/${tableId}`,
    { params: { outletId } },
  );
  return parseApiResponse(res);
}

export async function transferKot(
  payload: TransferKotPayload,
): Promise<{ success: boolean }> {
  const res = await apiClient.post<ApiResponse<{ success: boolean }>>(
    '/r/dine-in/kots/transfer-kot',
    payload,
  );
  return parseApiResponse(res);
}

export async function deleteKotItems(
  payload: DeleteKotItemPayload,
): Promise<{ success: boolean }> {
  const res = await apiClient.post<ApiResponse<{ success: boolean }>>(
    '/r/dine-in/kots/delete-kot',
    payload,
  );
  return parseApiResponse(res);
}
