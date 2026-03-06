# Split Bill — React Native: Modifiers (Discount, Service Charge, Tip, Extras) and UI Update

Use this prompt so that when the bill is **split**, adding a **discount** (or service charge, tip, extras) to a **splitted variant** applies to the correct bill and the **bill summary updates** in the native app.

---

## Problem

When the bill is split and the user adds a discount (or other modifier) to the **selected split variant**, the app was:

1. Sending the **parent bill id** to the modifier API instead of the **selected variant’s bill id**, so the discount was applied to the wrong bill, or
2. Not **refetching the split variants** after success, so the UI kept showing the old totals.

---

## Required behaviour

### 1. Modifier APIs use the **selected variant** when the bill is split

- **displayBill** = selected variant when split, else the single bill.
- All **bill modifier** actions (discount, service charge, tip, container/delivery charge) must be applied to **displayBill.id** when the bill is split.
- So:
  - **BillDiscountModal**, **BillServiceChargeModal**, **BillExtrasModal**, **AddTipModal** must receive **billId = displayBill?.id ?? parentBillId** (so for split we pass the variant id; for non-split we pass the main bill id).
  - **AddTipModal** must receive **currentTipTotal = displayBill?.tipTotal ?? 0** so the current tip shown is for the selected variant.

### 2. After modifier success: refetch so the UI updates

- When a modifier (e.g. discount) is applied successfully:
  1. **Refetch the parent bill** (e.g. `getBillById(billId)` in InstanceBillModal, or `refresh()` by table in BillScreen).
  2. If the bill is **split**, also **refetch the split variants** with `GET /r/dine-in/bill/split/:parentBillId`, then **set variants in state** (and normalize to `BillPreviewData` if needed).
- So the **onSuccess** callback for Discount, ServiceCharge, Extras, and AddTip modals must:
  - Refetch the main bill (so parent data is fresh).
  - If `bill.isSplit` and `bill.id` exist: call getSplitsByBillId(bill.id), normalize the response, and setVariants. That way **displayBill** (derived from variants) shows the updated discount/totals.

### 3. Single source for bill summary

- **Bill summary** (and line items, Settle button) always use **displayBill** (selected variant when split, single bill otherwise).
- **Settle** uses **displayBill.id** and **displayBill.payable**, and when opening the settle modal for a split variant, pass **isSplitVariant: true** if applicable.

---

## Implementation checklist (React Native)

- [ ] When bill is split, **displayBill** = `variants.find(v => v.id === selectedSplitBillId) ?? variants[0]`; when not split, **displayBill** = bill.
- [ ] **BillDiscountModal**, **BillServiceChargeModal**, **BillExtrasModal**, **AddTipModal** receive **billId={displayBill?.id ?? bill?.id ?? ''}** (or in InstanceBillModal **billId={displayBill?.id ?? billId}**).
- [ ] **AddTipModal** receives **currentTipTotal={displayBill?.tipTotal ?? 0}**.
- [ ] **onSuccess** for these modals is a function that: (1) refetches the main bill, (2) if bill is split, calls getSplitsByBillId(parentBillId), normalizes, and setVariants. Example: `handleModifierSuccess` / `refetchBillAndVariants`.
- [ ] Split variants are normalized to **BillPreviewData** (e.g. `normalizeBillPreviewData`) so the bill summary always gets consistent fields (subtotal, totalTax, discountTotal, payable, etc.).

---

## Summary

- **Split bill + add discount (or any modifier):** Use **displayBill.id** as the **billId** for the modifier API so the selected variant is updated. After success, **refetch the main bill** and **refetch split variants** (getSplitsByBillId) and set variants in state so **displayBill** and the bill summary update in the native app.
