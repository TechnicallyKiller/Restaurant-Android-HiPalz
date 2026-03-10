# Bill (Active Only), Transfer/Merge → Tables, Merged Table UI — Prompt

## 1. Show Bill button only when table is active (has bill)

### Requirement
If the table is **active** (i.e. it has a bill), then **only** show the Bill button/tab. Do not show the Bill tab when the table has no bill.

### Interpretation
- "Table is active" = table has a bill generated → use `hasBillForTable(currentTable.id)` from bill store.
- Show the Bill tab only when: `currentTable && hasBillForTable(currentTable.id)`.

### Solution
- In **POSScreen**, set `showBillTab = Boolean(currentTable && hasBillForTable(currentTable.id))`.
- Keep the existing effect that switches away from the Bill tab when `!showBillTab` so the user is not left on a non-existent tab.

---

## 2. After table transfer → Tables dashboard with updated data

### Requirement
When a **table transfer** takes place, send the user to the **table dashboard** (Tables screen) with **updated table data**.

### Solution
- **KotTransferModal** (KOT transfer from POS): Already navigates to Tables on success. Ensure tables are refetched before or when landing: in `onSuccess` call `refetchTables()` then `navigation.navigate('Tables')` (order can be refetch then navigate, or navigate and Tables screen will refetch on mount; prefer refetch then navigate so data is fresh).
- **TableActionsModal → TableTransferModal** (full table transfer): The modal’s `onSuccess` calls `onTransferOrMergeSuccess`. In POSScreen, set `onTransferOrMergeSuccess` to: `refetchKots(); refetchTables(); navigation.navigate('Tables');` so the user is taken to the Tables screen with updated data.

---

## 3. Same for merge table → Tables dashboard with updated data

### Requirement
When a **merge table** action completes, same behavior: send the user to the **table dashboard** with **updated table data**.

### Solution
- **TableActionsModal → MergeTableModal**: `onSuccess` already calls `onTransferOrMergeSuccess`. Reuse the same callback as above: `refetchKots(); refetchTables(); navigation.navigate('Tables');` so after merge the user lands on Tables with fresh data.

---

## 4. Merged table: distinct icon and background on Tables screen

### Requirement
If a table is **merged**, show a **nice icon** and **different background color** on the table card so it’s easy to see that the table is merged.

### Solution
- Table type has `isMergedParent`, `mergedTableNames`, `mergedTableDisplay` (see `api/types`).
- In **ActiveTableCard**: when `table.isMergedParent === true` or `(table.mergedTableNames?.length ?? 0) > 0`, apply a **merged** style: e.g. distinct background (e.g. purple/violet tint or secondary color tint) and a **link/merge icon** (e.g. 🔗 or a text/icon component) on the card.
- Keep or reuse the existing merged-table text (e.g. `mergedTableDisplay` or `mergedTableNames.join(', ')`) so the card still shows which tables are merged.

---

## 5. Inside merged table (POS): show which tables are merged (linking icon)

### Requirement
When the user is **inside** a merged table (POS screen), show a **linking icon** and indicate **which tables are merged**.

### Solution
- In **POSScreen** header (or just below the table name), when `currentTable` is merged (`currentTable.isMergedParent === true` or `(currentTable.mergedTableNames?.length ?? 0) > 0`), render a small row or pill with:
  - A **linking icon** (e.g. 🔗 or link icon).
  - Text such as “Merged: T1, T2” using `currentTable.mergedTableDisplay ?? currentTable.mergedTableNames?.join(', ') ?? 'Merged'`.
- Style it so it’s visible but not overwhelming (e.g. smaller font, muted or tertiary color).

---

## 6. Summary

| Item | Action |
|------|--------|
| Bill tab | Show only when `currentTable && hasBillForTable(currentTable.id)`. |
| Transfer (KOT + full table) | On success: refetch KOTs/tables, then `navigation.navigate('Tables')`. |
| Merge table | On success: same as transfer — refetch, then navigate to Tables. |
| Tables screen – merged card | Merged tables: distinct background + link/merge icon on ActiveTableCard. |
| POS – merged table | In header: show linking icon + “Merged: …” with table names. |

Implement these so the Bill tab is only for tables with a bill, transfer/merge both land the user on the Tables dashboard with updated data, merged tables are clearly styled on the table list, and inside a merged table the POS header shows which tables are linked.
