import type { BillPreviewData, BillPreviewItem } from '../api/types';

/**
 * If the API returned a wrapped bill (e.g. { bill: BillPreviewData } or { data: BillPreviewData }),
 * return the inner bill; otherwise return the value as-is.
 */
export function unwrapBillResponse<T = BillPreviewData>(data: unknown): T {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    if (o.bill && typeof o.bill === 'object') return o.bill as T;
    if (o.data && typeof o.data === 'object') return o.data as T;
  }
  return data as T;
}

/**
 * Normalize a bill object (e.g. from GET /r/dine-in/bill/split/:billId) to BillPreviewData
 * so the bill summary always receives the expected shape (handles snake_case or missing fields).
 */
export function normalizeBillPreviewData(raw: Record<string, unknown> | BillPreviewData): BillPreviewData {
  const num = (v: unknown): number => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
  const str = (v: unknown, fallback: string): string =>
    typeof v === 'string' ? v : fallback;
  const r = raw as Record<string, unknown>;
  const items = (raw.items ?? r.items) as BillPreviewItem[] | undefined;
  return {
    ...(raw as BillPreviewData),
    id: (raw.id ?? r.id) as string | undefined,
    subtotal: num(raw.subtotal ?? r.subtotal),
    discountTotal: num(raw.discountTotal ?? r.discount_total ?? raw.totalDiscount ?? r.total_discount),
    totalDiscount: num(raw.totalDiscount ?? r.total_discount ?? raw.discountTotal),
    totalTax: num(raw.totalTax ?? r.total_tax),
    cgstTotal: num(raw.cgstTotal ?? r.cgst_total),
    sgstTotal: num(raw.sgstTotal ?? r.sgst_total),
    serviceCharge: num(raw.serviceCharge ?? r.service_charge),
    deliveryCharge: num(raw.deliveryCharge ?? r.delivery_charge),
    containerCharge: num(raw.containerCharge ?? r.container_charge),
    tipTotal: num(raw.tipTotal ?? r.tip_total),
    roundOff: num(raw.roundOff ?? r.round_off),
    payable: num(raw.payable ?? r.payable),
    tableId: str(raw.tableId ?? r.table_id, ''),
    orderId: str(raw.orderId ?? r.order_id, ''),
    invoiceNumber: str(raw.invoiceNumber ?? r.invoice_number, ''),
    items: Array.isArray(items) ? items : [],
    status: (raw.status ?? r.status) as string | undefined,
    tableName: (raw.tableName ?? r.table_name) as string | undefined,
    isSplit: raw.isSplit ?? r.is_split,
    splitType: (raw.splitType ?? r.split_type) as string | undefined,
  };
}
