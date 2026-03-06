# Live Cart, Sidebar & Theme — Full Flow Prompt

Use this prompt to implement the following in the React Native app.

---

## 1. Cart page (POS cart tab): Show Cart instead of Place order

- On the **POS cart tab** (the tab that lists cart items and the bottom bar), **replace** the **Place order** button with a **Show Cart** button.
- Tapping **Show Cart** navigates to the **Live Cart** screen (same as the existing “Show Cart” in the header).
- **Place order** remains only on the **Live Cart** screen (bottom button there).

So: from POS cart tab the user taps “Show Cart” → goes to Live Cart → there they can edit (instruction, delete, quantity) and tap “Place order”.

---

## 2. Live Cart: line action order and header fix

### 2.1 Bottom section per cart line (order)

For each cart line in Live Cart, the **action row** order must be:

1. **Add instruction** (or edit instruction) — first
2. **Delete** (Remove) — second  
3. **Quantity picker** (+ / −) — last

So visually: `[ Add instruction ] [ Delete ] [ − qty + ]`.

### 2.2 Header not merging with status bar

- The Live Cart **header** (back button, title, burger icon) must **not** be covered by the phone’s **status bar** (notch / time / battery).
- Use **SafeAreaView** (or equivalent safe-area insets) so the header starts **below** the status bar and the **back button remains pressable** on real devices.

---

## 3. Sidebar (burger menu)

### 3.1 Opening the sidebar

- In the **Live Cart header**, add a **burger icon** (☰) on the right (or left, consistent with design).
- Tapping the burger icon **opens a sidebar** (drawer) from the left (or right).

### 3.2 Sidebar content (top to bottom)

- **Logged-in user:** Display the **name of the person who is logged in** (e.g. from auth: staff `nickName` or equivalent).
- **Connected IP / server:** Display the **connected server URL or IP** (e.g. the API base URL used for requests).
- **Dark mode:** A **toggle** (or button) to switch between **dark** and **light** mode. The app UI must **look correct in both** themes (see §4).
- **Logout:** A **Logout** button at the **bottom** of the sidebar. On tap: perform logout (clear auth, navigate to Login or Welcome as today).

Layout suggestion: user name and IP at top; dark mode toggle in the middle; logout fixed at bottom.

---

## 4. Dark and light mode

- The app must support **dark mode** and **light mode**.
- **Sidebar** contains the **dark mode** control (toggle or switch).
- All relevant screens and components must **use the active theme** (colors, backgrounds, borders) so that:
  - **Dark mode:** dark backgrounds, light text (current style).
  - **Light mode:** light backgrounds, dark text, borders/shadows that remain visible.
- Use a **theme store** (or context) so the chosen mode is persisted (e.g. in AsyncStorage) and applied on app launch.

---

## 5. Summary checklist

| Item | Description |
|------|-------------|
| POS cart tab | Replace “Place order” with “Show Cart” (navigate to Live Cart). |
| Live Cart line actions | Order: 1) Add instruction, 2) Delete, 3) Quantity +/−. |
| Live Cart header | SafeArea so header does not merge with status bar; back button pressable. |
| Burger icon | In Live Cart header; opens sidebar. |
| Sidebar | User name, connected IP, dark mode toggle, Logout at bottom. |
| Theme | Dark / light mode; UI correct in both; theme persisted. |

---

## 6. Reference (existing)

- **Auth:** `useAuthStore`, `user` (e.g. `nickName`), `logout()`.
- **API base URL:** `CONFIG.API_BASE_URL` or `getApiBaseUrl()` from config/env.
- **Navigation:** `navigation.navigate('LiveCart')`, `navigation.replace('POS')`.
- **Live Cart:** `LiveCartScreen.tsx`; cart list uses `CartListSection` with `onRemove`.

Implement the above so the cart flow, Live Cart layout, header safety, sidebar, and dark/light mode all work as described.

---

## 7. Implementation summary (done)

| Item | Implementation |
|------|----------------|
| POS cart tab | "Place order" replaced with "Show Cart" button; navigates to Live Cart. |
| Live Cart line actions | Order: 1) Add instruction, 2) Delete, 3) Quantity +/− (in `CartListSection`). |
| Live Cart header | `SafeAreaView` (edges top) from `react-native-safe-area-context`; header below status bar; back button pressable. |
| Burger icon | In Live Cart header (right); opens `Sidebar` component. |
| Sidebar | User name (`user.nickName`), connected server (`CONFIG.API_BASE_URL`), Dark mode toggle (`Switch`), Logout at bottom. |
| Theme | `useThemeStore` (isDark, setDark, hydrate); `getColors(isDark)` in theme; light/dark palettes; Live Cart and Sidebar use dynamic theme; theme hydrated in `App.tsx`. |
| SafeAreaProvider | Wraps app in `App.tsx` so `SafeAreaView` works. |
| Logout | Sidebar "Logout" → confirm alert → `logout()` then `navigation.reset` to Login. |
