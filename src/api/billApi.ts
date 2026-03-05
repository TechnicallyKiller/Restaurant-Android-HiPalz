import apiClient, { parseApiResponse } from './apiClient';
import type {
  BillPreviewData,
  BillPayPayload,
  PaymentModeItem,
  ApiResponse,
  CreateTableInstancePayload,
  CreateTableInstanceResponse,
  InstancedBillItem,
  BillDiscountAddPayload,
  BillDiscountRemovePayload,
  BillServiceChargeAddPayload,
  BillServiceChargeRemovePayload,
  BillExtraChargePayload,
  BillExtraChargeRemovePayload,
} from './types';

export async function billPreview(tableId: string, staffId: string): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/preview',
    { tableId, staffId },
  );
  return parseApiResponse(res);
}

export async function billGenerate(
  tableId: string,
  staffId: string,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/generate',
    { tableId, staffId },
  );
  return parseApiResponse(res);
}

export async function getBillByTable(tableId: string): Promise<BillPreviewData | null> {
  const res = await apiClient.get<ApiResponse<BillPreviewData | null>>(
    `/r/dine-in/bill/table/${tableId}`,
  );
  return parseApiResponse(res);
}

export async function getBillById(billId: string): Promise<BillPreviewData> {
  const res = await apiClient.get<ApiResponse<BillPreviewData>>(
    `/r/dine-in/bill/${billId}`,
  );
  return parseApiResponse(res);
}

export async function getInstancedBills(outletId: string): Promise<InstancedBillItem[]> {
  const res = await apiClient.get<ApiResponse<InstancedBillItem[]>>(
    '/r/dine-in/bill/instanced',
    { params: { outletId } },
  );
  return parseApiResponse(res);
}

export async function createTableInstance(
  payload: CreateTableInstancePayload,
): Promise<CreateTableInstanceResponse> {
  const res = await apiClient.post<ApiResponse<CreateTableInstanceResponse>>(
    '/r/dine-in/bill/create-table-instance',
    payload,
  );
  return parseApiResponse(res);
}

export async function payBill(payload: BillPayPayload): Promise<{ success: boolean }> {
  const res = await apiClient.post<ApiResponse<{ success: boolean }>>(
    '/r/dine-in/bill/payment/pay',
    payload,
  );
  return parseApiResponse(res);
}

export async function getPaymentModes(outletId: string): Promise<PaymentModeItem[]> {
  const res = await apiClient.get<ApiResponse<PaymentModeItem[]>>(
    '/r/payment-modes',
    { params: { outletId } },
  );
  return parseApiResponse(res);
}

// ----- Bill modifiers -----
export async function addBillDiscount(
  payload: BillDiscountAddPayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/discount/add',
    payload,
  );
  return parseApiResponse(res);
}

export async function removeBillDiscount(
  payload: BillDiscountRemovePayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/discount/remove',
    payload,
  );
  return parseApiResponse(res);
}

export async function addServiceCharge(
  payload: BillServiceChargeAddPayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/service-charge/add',
    payload,
  );
  return parseApiResponse(res);
}

export async function removeServiceCharge(
  payload: BillServiceChargeRemovePayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/service-charge/remove',
    payload,
  );
  return parseApiResponse(res);
}

export async function addContainerCharge(
  payload: BillExtraChargePayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/container-charge/add',
    payload,
  );
  return parseApiResponse(res);
}

export async function removeContainerCharge(
  payload: BillExtraChargeRemovePayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/container-charge/remove',
    payload,
  );
  return parseApiResponse(res);
}

export async function addDeliveryCharge(
  payload: BillExtraChargePayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/delivery-charge/add',
    payload,
  );
  return parseApiResponse(res);
}

export async function removeDeliveryCharge(
  payload: BillExtraChargeRemovePayload,
): Promise<BillPreviewData> {
  const res = await apiClient.post<ApiResponse<BillPreviewData>>(
    '/r/dine-in/bill/delivery-charge/remove',
    payload,
  );
  return parseApiResponse(res);
}
