# Bill Section — Items Listing as Grid (Name, Qty, Price, Amount) with Portions and Addons

Use this prompt so the **bill section** shows items in a **grid** with columns **Name | Qty | Price | Amount**, and **portions** and **addons** are mapped and displayed for each line.

---

## Problem

- The bill items list was a simple row per item (name × qty and a single amount), with no clear columns for qty, unit price, and line amount.
- **Portions** (variant names, e.g. "Half", "Full") and **addons** (addon group + choice name, quantity, price) were not shown on the bill, so the user could not see what was ordered per line.

---

## Required behaviour

### 1. Grid layout

- **Header row:** Name | Qty | Price | Amount.
- **Data rows:** One row per bill item with:
  - **Name:** Item name. Below it (when present): portion line and addon lines.
  - **Qty:** Item quantity.
  - **Price:** Unit price (e.g. `item.itemPrice`).
  - **Amount:** Line total (see below).

### 2. Portions (variants)

- If the bill item has a **portion/variant** (e.g. API returns `variantName`, `variant_name`, or `itemVariantName`), show under the item name: **"Portion: {name}"**.
- **BillPreviewItem** may include optional **variantName**. If the API uses different property names (e.g. snake_case), the grid component should map them so the portion is always displayed when present.

### 3. Addons

- If the bill item has **addonGroups** (or `addon_groups`), for each group and each choice show a line under the item name, e.g. **"{addonName}: {addonChoiceName} ×{qty} (₹{total})"** where total = choice price × quantity.
- Map both camelCase and snake_case (e.g. `addon_choice_name`, `addon_name`) so addons display regardless of API shape.

### 4. Line amount

- **Amount** = line total for that item.
- Prefer **item.subtotal** when present and > 0.
- Otherwise compute:  
  `(itemPrice × quantity) + containerCharge + Σ(addon choice price × quantity)` for all addon choices on that item.

---

## Implementation checklist

- [ ] **BillPreviewItem** has optional **variantName** (and API can return variant_name / itemVariantName; component normalizes).
- [ ] A **BillItemGrid** (or equivalent) component:
  - Accepts **items: BillPreviewItem[]**.
  - Renders a **header**: Name | Qty | Price | Amount.
  - For each item: **Name** cell = item name + portion line(s) + addon lines; **Qty** = quantity; **Price** = unit price; **Amount** = line total (subtotal or computed).
- [ ] **Bill screen** and **Instance bill modal** use this grid for **displayBill.items** (no duplicate inline item list).
- [ ] Portions and addons are rendered from **variantName** (or normalized variant field) and **addonGroups** (or addon_groups) with choice name, quantity, and price so the bill section shows full line details.

---

## Summary

- Bill items are shown in a **grid** with columns **Name | Qty | Price | Amount**.
- **Name** column includes item name, then **Portion: {name}** when the item has a variant, then addon lines **AddonName: ChoiceName ×qty (₹total)**.
- **Amount** uses item subtotal when available, else computed from unit price, quantity, container charge, and addon totals.
- Use a single shared component (e.g. **BillItemGrid**) for both the main Bill screen and the Instance bill modal so behaviour and mapping stay consistent.
