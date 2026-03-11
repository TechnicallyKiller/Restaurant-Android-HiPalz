# Bugfix: LiveCart getSnapshot, Bill Tab Not Showing, Table Sort

## 1. LiveCartScreen — getSnapshot infinite loop

### Error
```
The result of getSnapshot should be cached to avoid an infinite loop
```
At `LiveCartScreen.tsx:31` (Zustand `useCartStore` selector).

### Cause
The selector used was:
```tsx
const cartItems = useCartStore(s => (tableId ? (s.cartsByTableId[tableId] ?? []) : []));
```
When the cart is empty or `tableId` is null, the expression `?? []` or the literal `[]` creates a **new array reference every time** the selector runs. React's `useSyncExternalStore` (used by Zustand) requires that `getSnapshot` return the **same cached reference** when the underlying data has not changed. Returning a new `[]` each time makes React think the snapshot changed → re-render → selector runs again → new `[]` → infinite loop.

### Fix
Use a **stable empty array** at module scope and return it whenever the cart is empty (or tableId is null):
```tsx
const EMPTY_CART: CartItem[] = [];

// In component:
const cartItems = useCartStore(s => {
  if (!tableId) return EMPTY_CART;
  const cart = s.cartsByTableId[tableId];
  return cart ?? EMPTY_CART;
});
```
Never return a newly created `[]` from the selector.

---

## 2. Bill tab — preview API runs but bill does not show

### Behaviour
After placing an order, KOT count appears. When user clicks the Bill tab, the preview API is called but the bill/preview content does not show.

### Cause
POSScreen reads bill data like this:
```tsx
const getBillForTable = useBillStore(s => s.getBillForTable);
const billForTab = currentTable ? getBillForTable(currentTable.id) : null;
```
The component subscribes to **the function** `getBillForTable`. When `fetchPreview()` completes it calls `setBillForTable(tableId, data)`, which updates the store. The selected value (the function reference) does **not** change, so Zustand does not trigger a re-render. Thus `billForTab` is never updated and the UI keeps showing loading or empty.

### Fix
Subscribe to the **bill data** for the current table so that when the store updates, the selected value changes and the component re-renders:
```tsx
const billForTab = useBillStore(s =>
  currentTable ? s.getBillForTable(currentTable.id) : null
);
```
Remove the separate `getBillForTable` selector for this screen if it is only used to derive `billForTab`. Any other usage of `getBillForTable` (e.g. in effects) can stay as a separate selector or use the store inside the effect.

---

## 3. Tables sort — B2 before B10/B11 (natural order)

### Behaviour
Tables are shown alphabetically: B1, B11, B2 instead of B1, B2, B10, B11.

### Cause
Tables are displayed in the order returned by the API (or grouped without sort). String sort orders lexicographically, so "B11" < "B2".

### Fix
Sort table names in **natural** (human) order: compare numeric parts as numbers so that B2 < B10 < B11.

- Add a `naturalCompare(a: string, b: string): number` helper that splits each name into segments (e.g. text and number) and compares segment by segment (numbers compared numerically).
- In `useAreasAndTables`, when building `groupedRes`, sort each area's tables before setting state:
  `tables: (byArea.get(area.id) ?? []).sort((a, b) => naturalCompare(a.name, b.name))`.
- Optionally export the helper from a small `utils/sort.ts` (or similar) and use it in the hook.

---

## Summary

| Bug | Cause | Fix |
|-----|--------|-----|
| getSnapshot infinite loop | Selector returns new `[]` when cart empty | Return stable `EMPTY_CART` when no cart |
| Bill tab not showing | Subscribing to `getBillForTable` (function) | Subscribe to `getBillForTable(currentTable.id)` (bill data) |
| Tables B2 after B11 | Lexicographic sort | Natural sort by table name (numeric parts as numbers) |

Apply these in code, then verify: LiveCart opens without error, Bill tab shows preview after API completes, and tables list shows B1, B2, B10, B11 order.
