// ----- Generic API response -----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
}

// ----- Auth -----
export interface StaffLoginPayload {
  phone: string;
  password: string;
}

export interface Staff {
  id: string;
  outletId: string;
  userId: string;
  nickName: string;
  outletName?: string;
  outletImageUrl?: string;
  roleId?: string;
  status?: boolean;
}

export interface StaffLoginResponse {
  token: string;
  staff: Staff;
}

// ----- Areas & Tables -----
export type TableStatusType = 'EMPTY' | 'ACTIVE' | 'BILL_PRINTED';

export interface Area {
  id: string;
  name: string;
  areaTypeId: string;
  outletId: string;
  status: boolean;
}

export interface Table {
  id: string;
  name: string;
  areaId: string;
  outletId: string;
  capacity: number;
  status?: boolean;
  tableStatus?: TableStatusType;
  hiCode?: string;
  tableCurrentAmount?: number;
  mergedTableNames?: string[];
  isMergedParent?: boolean;
  mergedTableDisplay?: string;
}

// ----- Menu -----
export interface Category {
  id: string;
  name: string;
  parentCategoryId?: string | null;
}

export interface ItemAddonChoice {
  id: string;
  name: string;
  price: number;
}

export type AddOnChoiceType = 'SINGLE' | 'MULTIPLE';

export interface ItemAddon {
  id: string;
  name: string;
  addOnChoiceType: AddOnChoiceType;
  itemAddonChoices: ItemAddonChoice[];
  minQuantity?: number;
  maxQuantity?: number;
}

export interface ItemVariant {
  id: string;
  name: string;
  price?: number;
  priceModifier?: number;
}

export type AttributeValueType = 1 | 2 | 3;

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  attribute?: AttributeValueType | null;
  description?: string | null;
  status?: boolean;
  itemVariants?: ItemVariant[];
  itemAddons?: ItemAddon[];
}

// ----- Cart (local state) -----
export interface CartAddonEntry {
  addonChoiceId: string;
  addonName: string;
  quantity: number;
  price: number;
}

export interface CartConfig {
  variantId?: string | null;
  variantName?: string | null;
  addons: { addonChoiceId: string; quantity: number }[];
  notes?: string;
}

export interface CartItem {
  cartId: string;
  areaItemId: string;
  name: string;
  attribute?: AttributeValueType | null;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  basePrice: number;
  totalPrice: number;
  containerCharge: number;
  addons: CartAddonEntry[];
  notes: string;
  itemVariants?: ItemVariant[];
  itemAddons?: ItemAddon[];
}

export type CartTab = 'cart' | 'kot' | 'bill';

// ----- Place order (KOT) -----
export interface PlaceOrderCartLineAddonChoice {
  itemAddonChoiceId: string;
  itemAddonChoiceName: string;
  quantity: number;
  price: number;
}

export interface PlaceOrderCartLineAddon {
  itemAddonId: string;
  itemAddonName: string;
  itemAddonChoices: PlaceOrderCartLineAddonChoice[];
}

export interface PlaceOrderCartLineVariant {
  itemVariantId: string;
  itemVariantName: string;
  price: number;
}

export interface PlaceOrderCartLine {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  containerCharge: number;
  variant: PlaceOrderCartLineVariant | null;
  itemAddons: PlaceOrderCartLineAddon[];
  notes?: string;
}

export interface PlaceOrderPayload {
  outletId: string;
  tableId: string;
  captainId: string;
  cart: PlaceOrderCartLine[];
}

// ----- KOT response -----
export interface KotAddonChoice {
  id: string;
  areaAddonChoiceId: string;
  addonChoiceName: string;
  quantity: number;
  price: number;
}

export interface KotAddonGroup {
  id: string;
  areaItemAddonId: string;
  addonName: string;
  choices: KotAddonChoice[];
}

export interface KotItemVariant {
  id: string;
  areaItemVariantId: string;
  variantName: string;
  variantPrice: number;
}

export interface KotItem {
  id: string;
  name: string;
  quantity: number;
  status: string;
  notes: string;
  itemPrice: number;
  containerCharge: number;
  variants: KotItemVariant[];
  addonGroups: KotAddonGroup[];
}

export interface Kot {
  id: string;
  createdAt: number;
  updatedAt: number;
  orderId: string;
  tableId: string;
  status: string;
  kotType: string;
  sourceKotId: string | null;
  isPriority: boolean;
  kotInvoiceNumber: number;
  userName: string;
  userPhone: string;
  tableName: string;
  items: KotItem[];
}

// ----- Bill -----
export interface BillPreviewItemAddonChoice {
  id: string;
  addonChoiceName: string;
  quantity: number;
  price: number;
}

export interface BillPreviewItemAddonGroup {
  id: string;
  addonName: string;
  choices: BillPreviewItemAddonChoice[];
}

export interface BillPreviewItem {
  id: string;
  itemName: string;
  quantity: number;
  itemPrice: number;
  containerCharge?: number;
  addonGroups?: BillPreviewItemAddonGroup[];
  subtotal?: number;
}

export interface BillModifierAction {
  id: string;
  billId: string;
  staffId: string;
  staffName: string;
  actionType: string;
  modifierType: string;
  modifierValue: number;
  scope: string;
  targetItemId: string | null;
  reason: string | null;
  createdAt: number;
}

export interface BillPreviewData {
  id?: string;
  areaType?: string;
  billInvoiceNumber?: number;
  subtotal: number;
  discountTotal: number;
  totalDiscount?: number;
  taxableAmount?: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  categoryTaxMap?: Record<string, number>;
  serviceCharge: number;
  deliveryCharge: number;
  containerCharge: number;
  tipTotal: number;
  roundOff: number;
  payable: number;
  tableId: string;
  orderId: string;
  invoiceNumber: string;
  items: BillPreviewItem[];
  modifierActions?: BillModifierAction[];
  isSplit?: boolean;
  splitType?: string;
  status?: string;
  paymentMethod?: string | null;
  tableName?: string;
}

export interface BillTableEntry {
  bill: BillPreviewData;
  orderId?: string;
  isBillSplitted?: boolean;
  splitVariants?: BillPreviewData[];
  selectedSplitBillId?: string | null;
}

// ----- Payment -----
export interface BillPaySplitItem {
  mode: string;
  amount: number;
}

export type BillPayModeBackend =
  | 'CASH'
  | 'UPI'
  | 'UPI_MACHINE'
  | 'CARD_MACHINE'
  | 'NPC'
  | 'ZOMATO_PAY'
  | 'SWIGGY_PAY'
  | 'DUES'
  | 'COMPLEMENTARY'
  | 'SPLIT';

export interface BillPayPayload {
  billId: string;
  mode: BillPayModeBackend;
  staffId: string;
  userId?: string;
  splitModes?: BillPaySplitItem[];
}

export interface PaymentModeItem {
  id: string;
  name: string;
  status?: boolean;
}

// ----- Split bill -----
export interface SplitByPercentagePayload {
  billId: string;
  variantCount: number;
  variants: { percentage: number }[];
}

export interface SplitByItemWisePayload {
  billId: string;
  variantCount: number;
  variants: { billItemIds: string[] }[];
}

export interface SplitSettlePayload {
  splitBillId: string;
  staffId: string;
  mode: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'OTHER';
}

export interface SplitSettleResult {
  status: string;
  splitBillId: string;
  allPaid: boolean;
}

export interface ClubSplitsPayload {
  parentBillId: string;
  staffId: string;
}

export interface BillTipAddPayload {
  billId: string;
  amount: number;
  staffId: string;
}

export interface BillTipRemovePayload {
  billId: string;
  staffId: string;
  reason: string;
}

// ----- Table & KOT operations -----
export interface TransferKotPayload {
  outletId: string;
  fromTableId: string;
  toTableId: string;
  staffId: string;
  items: { kotItemId: string; quantity: number }[];
  reason?: string;
}

export interface TransferTablePayload {
  fromTableId: string;
  toTableId: string;
  reason: string;
  staffId: string;
}

export interface MergeTablesPayload {
  destinationTableId: string;
  sourceTableIds: string[];
  staffId: string;
}

export interface DeleteKotItemPayload {
  outletId: string;
  tableId: string;
  orderId: string;
  reason: string;
  deletedBy: string;
  items: { kotItemId: string; quantity: number }[];
}

// ----- Table instance -----
export interface CreateTableInstancePayload {
  billId: string;
  staffId: string;
}

export interface CreateTableInstanceResponse {
  status: string;
  billId: string;
  orderId: string;
}

export interface InstancedBillItem {
  /** Bill ID — used to open the instance and load bill details (backend may send as `id` or `billId`) */
  id?: string;
  billId?: string;
  orderId?: string;
  tableId?: string;
  tableName?: string;
  areaType?: string;
  userName?: string;
  userPhone?: string;
  captainName?: string;
  captainPhone?: string;
  payable?: number;
  createdAt?: number;
  [key: string]: unknown;
}

// ----- Bill modifiers (discount, service, extras) -----
export type BillDiscountApplyOn = 'ON_BILL' | 'ON_ITEM';
export type BillDiscountType = 'PERCENTAGE' | 'FLAT';

export interface BillDiscountAddPayload {
  billId: string;
  type: BillDiscountType;
  applyOn: BillDiscountApplyOn;
  value: number;
  itemIds?: string[];
  reason: string;
  staffId: string;
}

export interface BillDiscountRemovePayload {
  billId: string;
  staffId: string;
  reason?: string;
}

export interface BillServiceChargeAddPayload {
  billId: string;
  amount?: number;
  percentage?: number;
  staffId: string;
}

export interface BillServiceChargeRemovePayload {
  billId: string;
  staffId: string;
  reason?: string;
}

export interface BillExtraChargePayload {
  billId: string;
  amount: number;
  staffId: string;
}

export interface BillExtraChargeRemovePayload {
  billId: string;
  staffId: string;
  reason: string;
}
