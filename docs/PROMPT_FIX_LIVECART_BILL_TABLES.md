# Prompt: Fix LiveCart getSnapshot, Bill Tab, and Table Sort

Execute the following fixes in order.

---

## Task 1 — LiveCartScreen getSnapshot

**File:** `src/screens/LiveCartScreen.tsx`

- Define a module-level stable empty array, e.g. `const EMPTY_CART: CartItem[] = [];`
- Change the `useCartStore` selector so that when `tableId` is null or the table has no cart, it returns `EMPTY_CART` instead of a new `[]`.
- Ensure the selector never returns a newly created array literal when the cart is empty.

---

## Task 2 — POSScreen Bill tab not showing after preview

**File:** `src/screens/POSScreen.tsx`

- The screen must re-render when the bill store gets preview data. Currently it selects `getBillForTable` (function), so updates to the store do not cause a re-render.
- Select the bill for the current table directly, e.g.  
  `const billForTab = useBillStore(s => currentTable ? s.getBillForTable(currentTable.id) : null);`
- Keep using `getBillForTable` only where you need the function (e.g. inside effects or callbacks). For the main bill UI, derive `billForTab` from the selector above so that when `setBillForTable` runs after the preview API, the component re-renders and shows the bill/preview.

---

## Task 3 — Natural sort for table names

**Files:** `src/utils/naturalSort.ts` (new) and `src/hooks/useAreasAndTables.ts`

- Add a utility `naturalCompare(a: string, b: string): number` that compares strings in natural order (e.g. "B2" before "B10", "B11"). Split names into alternating text and number segments and compare numbers numerically.
- In `useAreasAndTables`, when building the grouped result, sort each area’s tables by `naturalCompare(a.name, b.name)` before setting `grouped`.
- Result: tables listed as B1, B2, B10, B11, not B1, B11, B2.

---

After implementing, verify: no getSnapshot warning on LiveCart, Bill tab shows preview after API completes, and table list order is natural.
