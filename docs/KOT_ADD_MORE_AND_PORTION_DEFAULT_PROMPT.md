# KOT Screen: Remove “Add more item” and Default First Portion in Variant Selection

Use this prompt to (1) **remove** the “Add more item” entry/button from the **KOT screen**, and (2) in **variant/portion selection** (e.g. when adding a dish that has portions), **select the first portion by default** so the user does not have to tap a variant before adding.

---

## Required behaviour

### 1. KOT screen — remove “Add more item”

- On the **KOT tab** (Kitchen Order Ticket list), there is currently an “Add more item” button at the bottom (or after the KOT list). **Remove** this control entirely from the KOT screen.
- Users can still add more items from the **Cart tab** (e.g. “Add more items” flow when a KOT already exists, or the main categories/dishes view when no KOT). The removal is only from the **KOT tab** UI.

### 2. Variant/portion selection — default to first portion

- When the user adds a dish that has **portions/variants** (e.g. Half, Full), the customise modal (or variant picker) is shown. **By default**, if the dish has at least one portion/variant, **pre-select the first one** (e.g. first in the list). The user can change it, but does not have to select a portion before adding to cart.
- Apply this wherever variant/portion selection happens for adding an item (e.g. **ItemCustomiseModal** when it opens with an item that has `itemVariants`). On open, set the selected variant to the first variant so the modal shows one portion already selected.

---

## Implementation checklist

- [ ] **POS / KOT tab:** Remove the “Add more item” button and any wrapper that only exists to show it on the KOT screen (e.g. the `TouchableOpacity` with “Add more item” text and `setAddMoreFromKotVisible(true)` in the KOT tab). Remove or adjust `kotListWithAddMore` style if it was only for that button. Do not remove “Add more items” from the **Cart** tab.
- [ ] **ItemCustomiseModal (or equivalent):** When the modal becomes visible and receives an `item` that has `itemVariants` (portions), set the initial selected variant to the **first** variant (first element of `itemVariants`). E.g. on `visible && item` change, if `item.itemVariants?.length > 0`, set `variantId` and `variantName` to the first variant’s `id` and `name` so the first portion is selected by default.

---

## Summary

- **KOT screen:** No “Add more item” button; add-more flow stays on Cart tab only.
- **Variant selection:** When opening the customise modal for a dish with portions, the first portion is selected by default.
