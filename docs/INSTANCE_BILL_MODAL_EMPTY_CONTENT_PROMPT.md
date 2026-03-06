# Instance Bill Modal — Empty Content (Only Header Visible)

When opening the **Settle instance** modal, the bill data is loaded (e.g. console.log shows items) but **only the header** (title + close button) is visible; the **body** (items grid, summary, buttons) does not appear.

---

## Likely cause: layout / flex

In React Native, the **sheet** container uses `maxHeight: '90%'` but no **flex** or explicit height. The **sheetBody** and **ScrollView** use `flex: 1` to fill remaining space. For `flex: 1` to work, the **parent** must have a defined height (or be in a flex container that gives it space). If the sheet does not participate in flex layout, it sizes only to its content; the header has fixed height but the body’s `flex: 1` has no “remaining space” to fill, so the body can collapse to **zero height** and nothing is visible below the header.

---

## Fix

1. **Sheet:** Give the sheet a height so the body has space:
   - Add `flex: 1` to the sheet so it takes available space inside the overlay (and keep `maxHeight: '90%'` so it doesn’t exceed 90% of the screen).
   - Or use a fixed height (e.g. `height: '90%'` or `Dimensions.get('window').height * 0.9`).
2. **Overlay:** Ensure the overlay is a column flex container (default in RN) so the sheet lays out correctly.
3. **Body:** Keep `sheetBody` with `flex: 1` and `minHeight` so the scroll + footer area gets the remaining space below the header.
4. Remove any debug `console.log` in the modal.

---

## Summary

- **Symptom:** Only heading and close button visible; items/summary/buttons not shown.
- **Cause:** Sheet has no flex/height, so body with `flex: 1` gets 0 height.
- **Fix:** Give the sheet `flex: 1` (and `maxHeight: '90%'`) so it gets a real height and the body can fill the rest.
