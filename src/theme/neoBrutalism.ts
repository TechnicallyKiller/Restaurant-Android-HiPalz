import { Platform, type ViewStyle } from 'react-native';

/** Neo-brutalist design system — dark palette (default). */
export const darkColors = {
  primary: '#6366f1',
  primaryForeground: '#ffffff',
  secondary: '#ec4899',
  tertiary: '#fbbf24',
  background: '#0c0a09',
  foreground: '#fafaf9',
  mutedForeground: '#d6d3d1',
  base100: '#1c1917',
  base200: '#292524',
  base300: '#44403c',
  brutalBorder: '#44403c',
  brutalShadow: 'rgba(255,255,255,0.2)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
} as const;

/** Light palette. */
export const lightColors = {
  primary: '#6366f1',
  primaryForeground: '#ffffff',
  secondary: '#ec4899',
  tertiary: '#d97706',
  background: '#fafaf9',
  foreground: '#1c1917',
  mutedForeground: '#78716c',
  base100: '#ffffff',
  base200: '#f5f5f4',
  base300: '#e7e5e4',
  brutalBorder: '#1c1917',
  brutalShadow: 'rgba(0,0,0,0.25)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
} as const;

export type ColorPalette = typeof darkColors;

/** Default export for backward compatibility — dark colors. */
export const colors = darkColors;

/** Get palette by theme (for use with useThemeStore). */
export function getColors(isDark: boolean): ColorPalette {
  return (isDark ? darkColors : lightColors) as ColorPalette;
}

/** 3px border for cards, buttons, modals */
export const borderBrutal: ViewStyle = {
  borderWidth: 3,
  borderColor: colors.brutalBorder,
};

/** Rounded corners (xl) */
export const borderRadius = 12;
export const borderRadiusLg = 16;

/** Hard offset shadow: 4px 4px 0. iOS: shadowOffset + shadowRadius 0; Android: elevation for similar lift. */
export const shadowBrutal: ViewStyle = {
  ...(Platform.OS === 'ios'
    ? {
        shadowColor: colors.brutalShadow,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      }
    : { elevation: 4 }),
};

/** Larger shadow for hover/lift (6px 6px 0) */
export const shadowBrutalLg: ViewStyle = {
  ...(Platform.OS === 'ios'
    ? {
        shadowColor: colors.brutalShadow,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
      }
    : { elevation: 6 }),
};

/** Pressed: no offset (pressed-into-page) */
export const shadowPressed: ViewStyle = {
  ...(Platform.OS === 'ios'
    ? {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
      }
    : { elevation: 0 }),
};

/** Card: border + background + shadow */
export const neoCard: ViewStyle = {
  ...borderBrutal,
  backgroundColor: colors.base100,
  borderRadius,
  ...shadowBrutal,
};

/** Primary button base */
export const neoButtonPrimary: ViewStyle = {
  ...borderBrutal,
  backgroundColor: colors.primary,
  borderRadius,
  ...shadowBrutal,
};

/** Tertiary/amber button (e.g. Place order, CTA) */
export const neoButtonTertiary: ViewStyle = {
  ...borderBrutal,
  backgroundColor: colors.tertiary,
  borderRadius,
  ...shadowBrutal,
};

/** Outline/ghost button */
export const neoButtonOutline: ViewStyle = {
  ...borderBrutal,
  backgroundColor: 'transparent',
  borderRadius,
};

/** Input: border + base background */
export const neoInput: ViewStyle = {
  ...borderBrutal,
  backgroundColor: colors.base200,
  borderRadius,
  ...shadowBrutal,
};

/** Modal container */
export const neoModal: ViewStyle = {
  ...borderBrutal,
  backgroundColor: colors.base100,
  borderRadius: borderRadiusLg,
  ...(Platform.OS === 'ios'
    ? {
        shadowColor: colors.brutalShadow,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
      }
    : { elevation: 8 }),
};

/** Typography: uppercase + letter-spacing for labels/buttons */
export const textUppercase = {
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
};

export const textBold = { fontWeight: '700' as const };
export const textBlack = { fontWeight: '900' as const };
