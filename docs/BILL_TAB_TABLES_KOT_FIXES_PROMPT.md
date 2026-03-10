# Bill Tab, Table Transfer & KOT Refetch — Fixes Prompt

## 1. Bill tab going back to order (empty table scenario)

### Problem
When the user clicks the **Bill** tab after placing an order, in the **empty table scenario** the app goes back to the order page instead of showing the bill. For an already active table the bill page appears correctly.

### Cause
- `showBillTab` is true only when `cartItems.length > 0 || hasBillForTable(currentTable.id) || kots.length > 0`.
- Right after place order the cart is cleared and KOT refetch is async (not awaited), so briefly `kots.length` can still be 0 and `showBillTab` becomes false.
- A `useEffect` runs: when `activeTab === 'bill' && !showBillTab` it sets tab to cart/kot, so the user is taken off the Bill tab.

### Solution
- **Always show the Bill tab when a table is selected:** `showBillTab = Boolean(currentTable)`. The Bill tab content already handles “no bill yet” with “Generate the bill” / Open Bill.
- **Only auto-leave Bill tab when there is no table:** In the `useEffect`, switch away from Bill only when `!currentTable` (e.g. no table selected), not when `!showBillTab`.
- **After place order:** Await `refetchKots()` before switching to the KOT tab so KOT list is updated and `showBillTab` stays correct.

---

## 2. After table transfer → show Tables screen

### Requirement
After a successful **table transfer** (KOT transfer), navigate to the **Tables** screen so the user sees the updated table list.

### Solution
- In POS screen, for `KotTransferModal` `onSuccess`: call existing refetch logic and then `navigation.navigate('Tables')`.
- Tables screen will mount and run its initial fetch (and, with fix below, poll every 10s).

---

## 3. Tables API refetch every 10 seconds (refetch interval)

### Requirement
Use a **refetch interval** (e.g. TanStack Query style) so the **tables API** is called every **10 seconds** to keep the table list up to date.

### Solution
- In `useAreasAndTables`, add an optional **refetch interval** (e.g. `refetchIntervalMs?: number`).
- When the hook is used on the Tables screen, pass `refetchIntervalMs: 10000`.
- In the hook: use `useEffect` with `setInterval(() => refetch(), refetchIntervalMs)` and clear interval on unmount (and when `refetchIntervalMs` is disabled).

---

## 4. After KOT delete → refetch KOT data

### Requirement
After **delete item** (KOT delete) completes, call the API to get **new KOT data** so the list updates.

### Solution
- Ensure `KotDeleteModal`’s `onSuccess` is invoked after a successful delete and that the parent (POS) refetches KOTs.
- POS already passes `onSuccess={refetchKots}`. Ensure the refetch is actually run and, if needed, that the modal awaits an async `onSuccess` so the refetch completes before the modal closes (optional; refetch can also run in background).
- If `onSuccess` is async (e.g. `async () => { await refetchKots(); }`), have the modal `await onSuccess()` so the list updates before closing.

---

## 5. Summary

| Item | Fix |
|------|-----|
| Bill tab empty table | showBillTab = Boolean(currentTable); only switch off Bill when !currentTable; await refetchKots after place order. |
| After transfer | onSuccess of KotTransferModal: navigate to Tables. |
| Tables polling | useAreasAndTables(refetchIntervalMs: 10000) on Tables screen; setInterval in hook. |
| After KOT delete | Ensure onSuccess refetchKots is called; optionally await in modal. |

Implement these so the Bill tab stays usable after place order, transfer shows Tables with fresh data, tables list polls every 10s, and KOT list updates after delete.
