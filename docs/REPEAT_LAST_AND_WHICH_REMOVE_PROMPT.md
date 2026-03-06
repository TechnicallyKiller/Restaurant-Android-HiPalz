# Repeat Last vs Add New & “Which Item to Remove” — Implementation

This doc references the **Repeat Last vs Add New & “Which Item to Remove” — Full Flow Prompt** and confirms where it is implemented in the React Native app.

## Flows implemented

### 1. Add or Increment on menu item (item card)

- **Item has no options** (`itemHasOptions(item) === false`): add directly with `defaultConfigForItem(item)`. No modal.
- **Item has options, no similar in cart** (`similar.length === 0`): open **ItemCustomiseModal** (variant/addon picker) only.
- **Item has options, ≥1 similar in cart** (`similar.length > 0`): open **RepeatLastOrNewModal**.
  - **Repeat last:** `addToCart(tableId, item, cartLineToConfig(lastSimilar), 1)` then close.
  - **Add new:** close Repeat modal and open **ItemCustomiseModal** for that item.

Both **Add** and **Increment** on the item card use this logic (Increment now also shows Repeat last / Add new instead of directly adding).

### 2. Decrement on menu item (item card)

- `similar = findSimilarItems(tableId, item.id)`.
- **similar.length === 0:** no-op.
- **similar.length === 1:** `updateQuantity(tableId, similar[0].cartId, -1)`.
- **similar.length > 1:** open **DecrementLineModal** (“which one to remove”); on select → `updateQuantity(tableId, cartId, -1)`.

### 3. Decrement on cart line (cart list / Live Cart)

- **line.quantity > 1:** `updateQuantity(tableId, line.cartId, -1)` (no modal).
- **line.quantity === 1:**
  - **similar.length ≤ 1:** `updateQuantity(tableId, line.cartId, -1)`.
  - **similar.length > 1:** open **DecrementLineModal**; on select → `updateQuantity(tableId, cartId, -1)`.

So “which to remove” is shown only when the user is removing the **last unit** of a line and there are **other lines** for the same dish.

## UI components

- **RepeatLastOrNewModal**  
  Title: “Add {itemName}”.  
  Description: “Same dish with same options (including note) or choose new variant/addons?”  
  Buttons: **Repeat last**, **Add new**, **Cancel**.

- **DecrementLineModal** (SimilarItemSelector)  
  Title: “Multiple {itemName} found”.  
  Subtitle: “Select which one to remove”.  
  List: each similar line with variant, addons summary, qty, and “Remove one”; tap row → `onSelectLine(cartId)`.

## Helpers

- **cartLineToConfig** (`src/api/cartUtils.ts`): builds `CartConfig` from a `CartItem` for “repeat last”.
- **itemHasOptions(item)**: `variants >= 2 || addons > 0` (same as prompt’s `needsOptions`).
- **findSimilarItems(tableId, itemId)** (cart store): all cart lines with `areaItemId === itemId`.

## Files

- **POSScreen.tsx:** `handleAddItem`, `handleIncrementItem`, `handleDecrementItem`, `handleCartDecrementRequest`; renders RepeatLastOrNewModal, DecrementLineModal, ItemCustomiseModal.
- **LiveCartScreen.tsx:** same `handleCartDecrementRequest` logic for cart list decrement.
- **RepeatLastOrNewModal.tsx:** Repeat last / Add new modal.
- **DecrementLineModal.tsx:** Which-line-to-remove modal.
- **cartStore.ts:** `findSimilarItems`, `addToCart`, `updateQuantity`.
- **cartUtils.ts:** `cartLineToConfig`.
