# Bill Still Visible on Table Dashboard After Settle — Rectification

When a user **settles** a bill (single payment or last split), the bill should **disappear** from the table dashboard (and from the Bill tab on POS for that table). The user should be taken back to the **Tables** list and the table should no longer show the settled bill.

---

## Required behaviour

1. **After successful settlement (single bill):** Clear the bill from the bill store for that table, refetch the table list, and navigate to the Tables screen so the user does not still see the bill on the dashboard/POS.
2. **After successful settlement (split bill, last variant):** Same as above — clear bill, refetch tables, navigate to Tables.
3. **After settling one variant of a split bill (more unpaid):** Do not clear the bill; refetch bill and variants so the UI shows updated status; user can settle the next variant. Only when all variants are paid do we clear and navigate.

---

## Root cause

In **BillScreen** `handleSettled`:

- For a **split** bill, when the payment API returns `allPaid === true`, we correctly clear the bill and navigate.
- For a **single (non-split)** bill, **SettleModal** calls `onSettled()` with **no argument**. So `allPaid` is `undefined`, and we never enter the block that clears the bill and navigates. We only `refetchBill()` and `refetchTables()`, so the bill **stays in the store** and the user remains on the Bill screen with the (already paid) bill still visible. The table dashboard (and POS Bill tab) still show the bill because `getBillForTable(tableId)` still returns the old bill.

---

## Fix

In **BillScreen** `handleSettled`:

- After closing the settle modal and (optionally) calling any shared callback, **if the bill is not split** (`!bill?.isSplit`), treat the settlement as complete: call `setBillForTable(currentTable.id, null)`, `refetchTables()`, and `navigation.navigate('Tables')`, then return. This matches the behaviour for `allPaid === true` for split bills.
- Keep existing logic for split bills: when `allPaid === true` or when after refetch all variants are PAID, clear and navigate; otherwise only refetch.

---

## Summary

- **Symptom:** After settling, the bill is still visible on the table dashboard / POS Bill tab.
- **Cause:** For a single bill, `handleSettled` never clears the bill or navigates because `allPaid` is only set for split-variant payments.
- **Fix:** When the bill is not split, after settle always clear the bill for that table, refetch tables, and navigate to Tables.
