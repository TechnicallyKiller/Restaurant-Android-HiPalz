/**
 * Permission flags for Cart/KOT/Bill section.
 * Wire to real auth/permissions when available; default all true.
 */
export const PERMISSIONS = {
  PLACE_KOT: true,
  GENERATE_BILL: true,
  SETTLE_BILL: true,
  ADD_DISCOUNT: true,
  ADD_SERVICE_CHARGE: true,
  ADD_CONTAINER_CHARGE: true,
  SPLIT_BILL: true,
} as const;

export function canPlaceKot(): boolean {
  return PERMISSIONS.PLACE_KOT;
}

export function canGenerateBill(): boolean {
  return PERMISSIONS.GENERATE_BILL;
}

export function canSettleBill(): boolean {
  return PERMISSIONS.SETTLE_BILL;
}

export function canAddDiscount(): boolean {
  return PERMISSIONS.ADD_DISCOUNT;
}

export function canAddServiceCharge(): boolean {
  return PERMISSIONS.ADD_SERVICE_CHARGE;
}

export function canAddContainerCharge(): boolean {
  return PERMISSIONS.ADD_CONTAINER_CHARGE;
}

export function canSplitBill(): boolean {
  return PERMISSIONS.SPLIT_BILL;
}
