# Neo Brutalism — React Native Design System

This app uses a **neo-brutalist** design system aligned with the web app. All shared tokens live in `src/theme/neoBrutalism.ts`.

## Theme usage

```ts
import { colors, borderBrutal, neoCard, neoButtonTertiary, shadowBrutal } from '../theme/neoBrutalism';
```

## Tokens

| Token | Usage |
|-------|--------|
| **colors** | `background`, `foreground`, `mutedForeground`, `base100`, `base200`, `base300`, `brutalBorder`, `brutalShadow`, `primary`, `tertiary`, `error`, `warning`, `success` |
| **borderBrutal** | 3px border; use for cards, buttons, inputs |
| **shadowBrutal** | Hard offset shadow 4×4 (iOS shadowOffset + shadowRadius 0; Android elevation) |
| **neoCard** | Card: border + base100 + shadow + borderRadius 12 |
| **neoButtonPrimary** | Primary (indigo) button |
| **neoButtonTertiary** | Amber/tertiary CTA (e.g. Place order, Sign in) |
| **neoButtonOutline** | Transparent + border |
| **neoInput** | Input: border + base200 + shadow |
| **neoModal** | Modal container: border + base100 + 8×8 shadow |
| **textUppercase** | textTransform + letterSpacing for labels/buttons |

## Layout (headers)

- **Header:** `flex: 0` (or fixed height), `zIndex: 10`, solid `backgroundColor` so content doesn’t show through when scrolling.
- **Content:** `flex: 1` and `ScrollView`; only the main area scrolls so header and footer stay clickable.

## Screens / components using the theme

- WelcomeScreen, LoginScreen, TablesScreen, POSScreen, LiveCartScreen
- LoginInput, SearchInput, OfflineBanner
- ItemCard, CartListSection, CartModal, ActiveTableCard

See the main design prompt (Neo Brutalism UI — Web & React Native) for full principles: bold borders, hard shadows, flat high-contrast colors, uppercase + tracking, dark mode tokens.
