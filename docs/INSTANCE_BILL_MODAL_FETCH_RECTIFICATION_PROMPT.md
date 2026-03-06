# Settle Instance Modal — Bill Fetched but Not Shown in Modal (Rectification)

When opening the **Settle instance** modal (table instance billing), the bill is **fetched successfully** but the **modal does not show** the bill data (stays on loading or shows "Could not load bill"). This prompt rectifies the issue.

---

## Likely causes

1. **Stale bill state:** When the modal opens, previous `bill` state (or null) is used. If we don’t clear `bill` when the modal closes or when `billId` changes, we may show old data or the UI may not transition correctly when a new instance is opened.
2. **Wrapped API response:** The GET bill-by-id endpoint may return the bill in a **nested** shape (e.g. `{ bill: BillPreviewData }` or `{ data: BillPreviewData }`) instead of the bill object at the top level. The code may then normalize the wrapper instead of the actual bill, so `items`, `payable`, etc. are missing and the UI treats it as "no bill".
3. **Effect timing:** The fetch runs in an effect when `visible && billId`; if `bill` is not reset when opening, the component might render with `bill !== null` from a previous instance and then overwrite with the new fetch, or the opposite — show null until the effect runs, and the effect might not run if dependencies are wrong.

---

## Required fixes

### 1. Reset bill state when modal closes or billId changes

- When `visible` becomes **false**, set `bill` to **null** (and clear `variants` / `selectedSplitBillId` if used) so the next time the modal opens we start from a clean state and show loading until the new fetch completes.
- When `billId` **changes** (e.g. user opens a different instance), clear `bill` before or when starting the new fetch so we don’t briefly show the previous instance’s bill.

### 2. Handle wrapped bill response from API

- After `getBillById(billId)` returns, check if the result is the bill **directly** (e.g. has `items` and `payable`) or is a **wrapper** (e.g. has a `bill` or `data` property that holds the actual bill).
- If wrapped, **extract** the inner bill object and pass **that** to `normalizeBillPreviewData`, then set state with the normalized bill. This keeps the modal consistent with normal table settlement regardless of API shape.

### 3. Ensure fetch runs when modal opens with a valid billId

- The effect that calls `refetchBill()` should depend on `visible` and `billId`. When the modal opens (`visible === true`) with a non-empty `billId`, the effect must run and fetch the bill, then set the normalized bill so the modal displays it.

---

## Implementation checklist

- [ ] **InstanceBillModal:** In a `useEffect` that depends on `visible` and `billId`, when `visible` is false or `billId` is empty, call `setBill(null)` and clear variants/selectedSplitBillId. When `visible` is true and `billId` is non-empty, then run the fetch.
- [ ] **InstanceBillModal:** After `getBillById(billId)` resolves, let `data = response`. If `data` is an object and has a property `bill` (or `data`) that is an object, use `const rawBill = data.bill ?? data.data ?? data` before normalizing; otherwise use `data`. Call `setBill(normalizeBillPreviewData(rawBill))`.
- [ ] Optionally centralize the "unwrap bill if needed" logic in `billUtils` and use it from InstanceBillModal so both instance and normal flows stay in sync.

---

## Summary

- **Reset state** when the modal closes or `billId` changes so the UI always reflects the current instance.
- **Unwrap** the API response if the bill is nested (`bill` / `data`) before normalizing and setting state.
- **Effect** runs on `visible` and `billId` so opening the modal with an id always triggers a fetch and the modal shows the fetched bill.
