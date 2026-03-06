# Live Cart – Feature Prompt

## Goal
Add a dedicated **Live Cart** screen that appears **before** placing the order. The user can review items, remove unwanted ones, then tap **Place order**.

## User flow

1. **On POS (order screen)**  
   - User adds items to the cart (via item cards / customise modal).  
   - As soon as the cart has at least one item, show a prominent **Show Cart** button (e.g. floating or fixed so it’s always visible when cart is non‑empty).

2. **Show Cart**  
   - Tapping **Show Cart** opens the **Live Cart** screen (full screen or modal that behaves like a page).  
   - Do not place the order automatically; the user must explicitly tap **Place order** on the Live Cart screen.

3. **Live Cart screen**  
   - **Title:** e.g. “Live Cart” or “Cart”.  
   - **Content:**  
     - List of cart items (name, quantity, price, variants/addons, notes).  
     - Per line: **quantity** controls (+ / −) and ability to **delete** the line (remove from cart).  
     - Optional: edit **instructions/notes** per line.  
   - **Footer:**  
     - **Place order** button.  
     - Optionally show cart total (item count, total amount).  
   - **Back / Close:** Return to POS without placing the order (cart stays as is).

4. **Place order (from Live Cart)**  
   - Only when the user taps **Place order** on the Live Cart screen:  
     - Call the same place‑order / KOT API as today.  
     - On success: clear or update cart state, switch to KOT tab or show success, and close/return from Live Cart as appropriate.

## Requirements (summary)

- **Show Cart** button visible on POS only when cart has ≥ 1 item.  
- **Live Cart** is a separate screen (or full‑screen modal) before placing the order.  
- On Live Cart: list items, change quantity, **delete** unwanted lines, then **Place order**.  
- Order is placed only when user taps **Place order** on Live Cart (and only from there for this flow).  
- Reuse existing cart store, place‑order API, and permissions (e.g. `canPlaceKot`).

## Out of scope (for this prompt)
- Changing how the existing Cart tab or Cart modal works beyond adding the **Show Cart** → Live Cart entry point.  
- Changing bill or KOT list behaviour.
