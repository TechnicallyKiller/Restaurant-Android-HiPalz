# Tables Screen: Instance Settlement, Start Table, and Table List

Use this prompt to (1) fix **table instance settlement** so data maps properly and billing matches normal table settlement, (2) put the **Start table** button **fixed at the bottom**, (3) show **only active tables** in the main table list (no empty tables; empty tables only in the Start table modal), and (4) make the **Start table modal** full height (**100dvh**) with **zone-wise grouping** and a **search input**.

---

## Required behaviour

### 1. Table instance settlement — data mapping and billing

- When settling a **table instance** (bill from a freed table), the bill data must be **mapped/normalized** the same way as for a normal table. Use the same normalization as the main Bill screen (e.g. `normalizeBillPreviewData`) so that fields like `subtotal`, `payable`, `discountTotal`, `items`, etc. are consistent (including snake_case from API). Instance settlement UI (summary, items, settle flow) should behave identically to normal table settlement.

### 2. Start table button fixed at bottom

- The **Start table** button must be **fixed at the bottom** of the Tables screen (e.g. sticky/fixed bar at bottom). The rest of the content (instance cards, search, table list) scrolls above it.

### 3. Main table list — only active tables

- In the **main table list** (area sections with table cards), show **only active tables** (tables that are not empty). Do **not** show **empty** tables in this list.
- **Empty tables** are shown **only** inside the **Start table modal** (when the user taps Start table). So: main list = active (and bill processing) tables only; empty tables = only in the modal.

### 4. Start table modal — height, zones, search

- **Height:** The Start table modal should use **100dvh** (or equivalent full viewport height) so it takes the full screen.
- **Zone-wise filter:** Keep the existing zone/area-wise grouping of tables (sections per area).
- **Search input:** Add a **search input** inside the modal to filter tables by name (and optionally table code). Only empty tables are listed; search filters within those.

---

## Implementation checklist

- [ ] **Instance settlement:** In the component that loads bill for an instance (e.g. `InstanceBillModal`), after fetching the bill by ID, **normalize** the response with `normalizeBillPreviewData` before setting state, so all summary and item fields match normal table billing.
- [ ] **TablesScreen layout:** Restructure so the **Start table** button sits in a **fixed bottom bar** (e.g. `position: 'absolute', bottom: 0` or a flex container with scrollable content and a footer). Ensure the scrollable content has padding at the bottom so it is not hidden behind the button.
- [ ] **TablesScreen table list:** When rendering the list of tables (grouped by area), **filter out** tables with status **EMPTY**. Only render tables that are ACTIVE or BILL_PRINTED (or any non-EMPTY status). Empty tables are not shown in this list.
- [ ] **EmptyTablesModal:** Set the modal content height to **100dvh** (use `height: '100%'` or `flex: 1` with a full-screen container; on React Native consider `height: '100%'` and ensure the parent overlay is full screen). Add a **search input** at the top of the modal content; filter the list of empty tables (by table name and optionally hiCode) by the search query. Keep zone/area-wise grouping so zones act as the filter; search filters within the current list.

---

## Summary

- **Instance settlement:** Normalize bill data so billing = same as normal table.
- **Start table button:** Fixed at bottom of Tables screen.
- **Main list:** Active (and bill processing) tables only; no empty tables.
- **Start table modal:** 100dvh height, zone-wise groups, search input to filter empty tables.
