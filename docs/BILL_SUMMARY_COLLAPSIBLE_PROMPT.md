# Bill Summary — Collapsible with Icon, Refresh in Front of Payable

Use this prompt so that in the **bill section** the **bill summary** is **collapsible** (open/close with icon). When **collapsed**, show only the **payable amount** and keep **all action buttons** visible. When **expanded**, show the **full summary** (subtotal, tax, charges, discount, round off, payable). **Refresh** is removed from the bottom footer and shown **in front of** the payable amount (same row as Payable).

---

## Required behaviour

### 1. Collapsible bill summary

- **Toggle:** A clear open/close control with an **icon** (e.g. chevron down ▲ when collapsed to expand, chevron up ▼ when expanded to collapse).
- **Collapsed state:** Only the **payable amount** is shown in the summary block (plus the collapse/expand icon). All other footer content (action buttons: Discount, Service charge, Extras, Add tip, Split/Merge, Print, and primary buttons like Settle, Create instance) remains visible below the summary and does not scroll away.
- **Expanded state:** Show the **full bill summary**: Subtotal, CGST/SGST or Tax, Service charge, Container/Delivery charge, Tip, Discount, Round off, and **Payable**.

### 2. Refresh placement

- **Remove** the **Refresh** button from the **bottom** of the bill footer (e.g. the standalone "Refresh" link/button at the end of the footer).
- **Add** a **Refresh** control **in front of** the payable amount (e.g. on the same row as "Payable ₹X", to the left of the payable value). This can be an icon button or a small "Refresh" label that triggers the same refetch as the old bottom Refresh.

### 3. Where to apply

- **Bill screen:** Collapsible BillSummary in the fixed footer; Refresh next to Payable; no Refresh at bottom.
- **Instance bill modal:** Same behaviour — collapsible summary, Refresh in front of Payable when the summary is shown (collapsed or expanded).

---

## Implementation checklist

- [ ] **BillSummary component:** Add internal state (or controlled prop) for expanded/collapsed. Render a header row with collapse/expand **icon** (e.g. ▲ / ▼). When **collapsed**, show only that row with: icon + **Refresh** (if `onRefresh` provided) + **Payable** amount. When **expanded**, show the header row (with icon) and below it all summary rows (subtotal, tax, charges, discount, round off) and the Payable row; on the Payable row show **Refresh** (if provided) in front of the Payable label/value.
- [ ] **BillSummary props:** Add optional `onRefresh?: () => void`. When set, render the Refresh control in front of Payable (both in collapsed and expanded views).
- [ ] **Bill screen:** Remove the standalone "Refresh" button from the footer. Pass `onRefresh={refetchBill}` (or equivalent) to `BillSummary`.
- [ ] **Instance bill modal:** Pass `onRefresh` to `BillSummary` (e.g. refetch bill + variants) so Refresh appears in front of Payable; ensure no duplicate Refresh at bottom if present.

---

## Summary

- **Collapsed:** Icon + Payable amount (+ Refresh in front of Payable). All buttons stay in the footer.
- **Expanded:** Icon + full summary (all lines) + Payable row with Refresh in front of Payable.
- **Refresh:** Only next to Payable; removed from bottom of the screen/modal.
