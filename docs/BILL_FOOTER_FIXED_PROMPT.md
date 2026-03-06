# Bill Section — Bill Summary and All Buttons Fixed at Bottom

Use this prompt so that in the **bill section** (Bill screen and Instance bill modal), the **bill summary** and **all action buttons** are **fixed at the bottom** of the screen. Only the **items list** (and variant tabs when split) scroll.

---

## Required behaviour

### 1. Scrollable area

- **Variant tabs** (when bill is split): Bill 1 · ₹X, Bill 2 · ₹Y, etc.
- **Bill items grid**: Name | Qty | Price | Amount (with portions and addons).
- These stay inside a **ScrollView** so long bills can be scrolled. The scroll area has **padding at the bottom** so content is not hidden behind the fixed footer.

### 2. Fixed bottom (footer)

- **Bill summary** (subtotal, tax, charges, discount, round off, **Payable**).
- **Action buttons row**: Discount, Service charge, Extras, Add tip, Split bill / Merge bill, Print (when applicable).
- **Primary actions**: Generate bill (when no bill) **or** Settle + Create table instance (when bill exists). Refresh can be in the footer or as a secondary control.
- This block is **fixed at the bottom** (e.g. `position: 'absolute', bottom: 0` or a flex layout where the scroll view takes remaining space and the footer sits below it). Background and optional top border so it’s visually distinct.

### 3. Where to apply

- **Bill screen** (main Bill tab/screen): Same layout — scrollable items + variant tabs; fixed footer with summary and all buttons.
- **Instance bill modal**: Same idea — scrollable content; fixed footer with summary, modifier buttons, and Settle.

---

## Implementation checklist

- [ ] ScrollView contains only: variant selector (if split) + bill items grid. Add `contentContainerStyle={{ paddingBottom: X }}` so the last row is not covered by the footer (X ≈ height of footer).
- [ ] A **fixed footer** View (position absolute bottom 0, or flex-end) contains: BillSummary, action row (Discount, Service charge, Extras, Add tip, Split/Merge, Print), then primary button(s) (Generate bill / Settle, Create instance) and optionally Refresh.
- [ ] Footer has a solid background and optional top border so it’s clearly separated from the scroll content.
- [ ] Applied on both **BillScreen** and **InstanceBillModal** so behaviour is consistent.

---

## Summary

- **Scroll:** Variant tabs + bill items grid.
- **Fixed at bottom:** Bill summary + all modifier and action buttons (Discount, Service charge, Extras, Add tip, Split/Merge, Print, Settle, Create instance, etc.). Summary and buttons are always visible and do not scroll away.
