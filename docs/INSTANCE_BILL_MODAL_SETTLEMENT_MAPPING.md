# InstanceBillModal — Settlement Mapping (Full Explanation)

Use this prompt to understand and implement **all mappings** from the instance bill modal through to **settlement**: data loading, display bill derivation, UI → SettleModal props, API payloads, and post-settle behaviour.

---

## 1. Entry and Input

| Concept | Value / Source |
|--------|-----------------|
| **Modal props** | `visible: boolean`, `onClose: () => void`, `billId: string` |
| **Entry point** | User opens an **instanced bill** from the Tables page (e.g. clicks an instance card). The card provides the **bill id** (the parent bill id for that instance). |
| **What we have on open** | Only `billId` (string). No bill data yet — it is fetched when the modal opens. |

---

## 2. Data Loading (Bill and Splits)

### 2.1 Initial load

When `visible && billId`:

1. **API:** `getBillById(billId)` → `GET /r/dine-in/bill/:billId`
2. **Response:** Single object of type `BillPreviewData` (see §6).
3. **State:** Result is stored in `bill` (useState).

### 2.2 Split variants (when bill is split)

If the loaded bill has `bill.isSplit === true` and `bill.id` is set:

1. **API:** `getSplitsByBillId(bill.id)` → `GET /r/dine-in/bill/split/:billId`  
   - Use the **parent bill's id** (same as the modal's `billId`).
2. **Response:** Array of `BillPreviewData[]` — one object per **variant** (split child). Each variant has its own `id`, `payable`, `items`, `status`, etc.
3. **State:**  
   - `variants` = that array.  
   - `selectedSplitBillId` = id of the variant to show. Default: first unpaid or first variant.

If the bill is **not** split:

- `variants` = `null`, `selectedSplitBillId` = `null`.

### 2.3 Refetch

- **Refetch bill:** Same as initial load: `getBillById(billId)` then, if `isSplit`, `getSplitsByBillId(bill.id)` and update `bill`, `variants`, `selectedSplitBillId`.
- **When:** After add/remove discount, service charge, tip, container/delivery charge; after merge splits; after settling one variant (when not all paid).

---

## 3. Display Bill (Single Source for All Bill UI)

All bill content (summary, line items, footer, Settle button, modals) must use **one** bill object: the **display bill**.

| Condition | Formula |
|-----------|---------|
| **Bill is split** (`bill?.isSplit === true` and `variants?.length > 0`) | `displayBill = variants.find(v => v.id === selectedSplitBillId) ?? variants[0] ?? bill` |
| **Bill is not split** | `displayBill = bill` |

- **displayBill** is the **selected variant** when split, or the single bill when not split.
- **Never** use the parent `bill` for summary/footer/settle when the bill is split — only for "Merge" (which uses `bill.id`) and for SplitBillModal (which uses `bill`).

---

## 4. UI Mapping: What Passes Where

### 4.1 Bill content and footer

| Component | Prop / usage | Source (mapping) |
|-----------|----------------|-------------------|
| **BillItemGrid** | `items={displayBill?.items}` | displayBill |
| **BillSummary** | `data={displayBill}`, `billId={displayBill.id}` | displayBill |
| **Settle button** | Opens Settle modal | — |
| **Print** | `printBill(displayBill.id)` | displayBill.id (selected variant when split) |
| **Merge** | Uses `bill.id` (parent) | Only when split |
| **Split bill** | Opens SplitBillModal with `bill` | Only when not split |

### 4.2 Modals that act on the current (display) bill

All use **displayBill** so that when the bill is split, actions apply to the **selected variant**:

| Modal | Props (key mappings) |
|-------|------------------------|
| **BillDiscountModal** | `billId={displayBill.id}`, `onSuccess={handleModifierSuccess}` |
| **BillServiceChargeModal** | `billId={displayBill.id}`, `onSuccess={handleModifierSuccess}` |
| **BillExtrasModal** | `billId={displayBill.id}`, `onSuccess={handleModifierSuccess}` |
| **AddTipModal** | `billId={displayBill.id}`, `currentTipTotal={displayBill.tipTotal}`, `onSuccess={handleModifierSuccess}` |
| **SplitBillModal** | Uses **parent** bill: `bill={bill}`, `onSuccess={handleModifierSuccess}` |
| **SettleModal** | See §5. |

### 4.3 Variant selector (split only)

When `bill?.isSplit && variants?.length >= 1`:

- Render one button per variant: "Bill 1 · ₹{v.payable}", etc.
- **Selected:** `v.id === selectedSplitBillId`.
- **On click:** `setSelectedSplitBillId(v.id)`. This changes `displayBill`; summary, footer, and Settle all update.

---

## 5. Settlement Mapping: InstanceBillModal → SettleModal

### 5.1 Props passed to SettleModal

| Prop | Value | Meaning |
|------|--------|---------|
| **visible** | `settleVisible` | Modal visibility. |
| **onClose** | `() => setSettleVisible(false)` | Close without paying. |
| **billId** | `displayBill.id` | **Variant bill id** when split, or single bill id when not split. |
| **payableAmount** | `displayBill.payable` | Amount to pay for **this** bill (variant or single). |
| **isSplitVariant** | `bill?.isSplit === true` | So SettleModal uses split-settle API for single payment. |
| **onSettled** | `handleSettled` | Called after successful payment; see §7. |

Critical: **billId** and **payableAmount** must always come from **displayBill**, not from `bill`, when the bill is split.

---

## 6. Settlement Mapping: SettleModal → API

### 6.1 Single payment (one mode)

| If | API | Payload |
|----|-----|---------|
| **isSplitVariant === true** | `POST /r/dine-in/bill/split/settle` (`settleSplit`) | `splitBillId: billId` (displayBill.id), `staffId`, `mode` |
| **isSplitVariant === false** | `POST /r/dine-in/bill/payment/pay` (`payBill`) | `billId`, `staffId`, `mode` |

**Split-settle response:** May include `{ allPaid: boolean }`. `allPaid === true` when this was the last unpaid variant.

### 6.2 Split payment (multiple modes)

- **API:** `POST /r/dine-in/bill/payment/pay` with `billId` (displayBill.id), `mode: "SPLIT"`, `splitModes: [{ mode, amount }, ...]`.
- **After success:** `onSettled()` (no argument).

---

## 7. Post-Settle: handleSettled and Modal/Data Lifecycle

**handleSettled** is called by SettleModal after a successful payment. It receives `result?: { allPaid?: boolean }` (only for single payment via split-settle; split payment does not pass it).

### 7.1 Always

1. Close Settle modal: `setSettleVisible(false)`.
2. Call `onSettled?.()` so parent can invalidate/refetch (instanced list, tables).

### 7.2 Then branch

| Condition | Action |
|-----------|--------|
| **result?.allPaid === true** (last variant paid) **or** **!bill?.isSplit** (single bill paid) | Close the instance modal: `onClose()`. |
| **Split bill and not all paid** | Do **not** close the instance modal. Call `refetchBill()` to reload bill and variants. User can select another variant and Settle again. |

---

## 8. Quick Reference (Settlement Only)

| From | To | Mapping |
|------|----|---------|
| InstanceBillModal | displayBill | Selected variant or single bill; never parent when split. |
| displayBill | SettleModal billId | `displayBill.id` |
| displayBill | SettleModal payableAmount | `displayBill.payable` |
| displayBill | Print | `printBill(displayBill.id)` |
| SettleModal (single, split variant) | API | `settleSplit({ splitBillId: displayBill.id, ... })` |
| SettleModal (single, non-split) | API | `payBill({ billId: displayBill.id, ... })` |
| SettleModal (split payment) | API | `payBill({ billId: displayBill.id, mode: "SPLIT", splitModes })` |
| API success | UI | If allPaid or single bill → close instance modal; else refetch bill. |
