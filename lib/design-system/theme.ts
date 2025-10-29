/**
 * Theme System
 * Comprehensive theme management with light/dark modes and custom themes
 */

import { colors, typography, spacing, shadows, borderRadius } from "./tokens";

// Theme Types
export interface Theme {
  name: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
    info: string;
    infoForeground: string;
  };
  typography: typeof typography;
  spacing: typeof spacing;
  shadows: typeof shadows;
  borderRadius: typeof borderRadius;
}

// Light Theme
export const lightTheme: Theme = {
  name: "light",
  colors: {
    background: colors.neutral[50],
    foreground: colors.neutral[900],
    card: colors.neutral[50],
    cardForeground: colors.neutral[900],
    popover: colors.neutral[50],
    popoverForeground: colors.neutral[900],
    primary: colors.primary[600],
    primaryForeground: colors.neutral[50],
    secondary: colors.secondary[100],
    secondaryForeground: colors.secondary[900],
    muted: colors.secondary[100],
    mutedForeground: colors.secondary[500],
    accent: colors.secondary[100],
    accentForeground: colors.secondary[900],
    destructive: colors.error[500],
    destructiveForeground: colors.neutral[50],
    border: colors.secondary[200],
    input: colors.secondary[200],
    ring: colors.primary[600],
    success: colors.success[500],
    successForeground: colors.neutral[50],
    warning: colors.warning[500],
    warningForeground: colors.neutral[50],
    info: colors.info[500],
    infoForeground: colors.neutral[50],
  },
  typography,
  spacing,
  shadows,
  borderRadius,
};

// Dark Theme
export const darkTheme: Theme = {
  name: "dark",
  colors: {
    background: colors.neutral[950],
    foreground: colors.neutral[50],
    card: colors.neutral[950],
    cardForeground: colors.neutral[50],
    popover: colors.neutral[950],
    popoverForeground: colors.neutral[50],
    primary: colors.primary[500],
    primaryForeground: colors.neutral[900],
    secondary: colors.secondary[800],
    secondaryForeground: colors.secondary[50],
    muted: colors.secondary[800],
    mutedForeground: colors.secondary[400],
    accent: colors.secondary[800],
    accentForeground: colors.secondary[50],
    destructive: colors.error[600],
    destructiveForeground: colors.neutral[50],
    border: colors.secondary[800],
    input: colors.secondary[800],
    ring: colors.primary[500],
    success: colors.success[600],
    successForeground: colors.neutral[50],
    warning: colors.warning[600],
    warningForeground: colors.neutral[50],
    info: colors.info[600],
    infoForeground: colors.neutral[50],
  },
  typography,
  spacing,
  shadows,
  borderRadius,
};

// Blue Theme
export const blueTheme: Theme = {
  name: "blue",
  colors: {
    background: colors.neutral[50],
    foreground: colors.neutral[900],
    card: colors.neutral[50],
    cardForeground: colors.neutral[900],
    popover: colors.neutral[50],
    popoverForeground: colors.neutral[900],
    primary: colors.info[600],
    primaryForeground: colors.neutral[50],
    secondary: colors.info[100],
    secondaryForeground: colors.info[900],
    muted: colors.info[50],
    mutedForeground: colors.info[500],
    accent: colors.info[100],
    accentForeground: colors.info[900],
    destructive: colors.error[500],
    destructiveForeground: colors.neutral[50],
    border: colors.info[200],
    input: colors.info[200],
    ring: colors.info[600],
    success: colors.success[500],
    successForeground: colors.neutral[50],
    warning: colors.warning[500],
    warningForeground: colors.neutral[50],
    info: colors.info[500],
    infoForeground: colors.neutral[50],
  },
  typography,
  spacing,
  shadows,
  borderRadius,
};

// Green Theme
export const greenTheme: Theme = {
  name: "green",
  colors: {
    background: colors.neutral[50],
    foreground: colors.neutral[900],
    card: colors.neutral[50],
    cardForeground: colors.neutral[900],
    popover: colors.neutral[50],
    popoverForeground: colors.neutral[900],
    primary: colors.success[600],
    primaryForeground: colors.neutral[50],
    secondary: colors.success[100],
    secondaryForeground: colors.success[900],
    muted: colors.success[50],
    mutedForeground: colors.success[500],
    accent: colors.success[100],
    accentForeground: colors.success[900],
    destructive: colors.error[500],
    destructiveForeground: colors.neutral[50],
    border: colors.success[200],
    input: colors.success[200],
    ring: colors.success[600],
    success: colors.success[500],
    successForeground: colors.neutral[50],
    warning: colors.warning[500],
    warningForeground: colors.neutral[50],
    info: colors.info[500],
    infoForeground: colors.neutral[50],
  },
  typography,
  spacing,
  shadows,
  borderRadius,
};

// Available Themes
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  blue: blueTheme,
  green: greenTheme,
} as const;

export type ThemeName = keyof typeof themes;

// Theme Context
export interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  toggleTheme: () => void;
}

// CSS Variables Generator
export function generateCSSVariables(theme: Theme): Record<string, string> {
  return {
    "--background": theme.colors.background,
    "--foreground": theme.colors.foreground,
    "--card": theme.colors.card,
    "--card-foreground": theme.colors.cardForeground,
    "--popover": theme.colors.popover,
    "--popover-foreground": theme.colors.popoverForeground,
    "--primary": theme.colors.primary,
    "--primary-foreground": theme.colors.primaryForeground,
    "--secondary": theme.colors.secondary,
    "--secondary-foreground": theme.colors.secondaryForeground,
    "--muted": theme.colors.muted,
    "--muted-foreground": theme.colors.mutedForeground,
    "--accent": theme.colors.accent,
    "--accent-foreground": theme.colors.accentForeground,
    "--destructive": theme.colors.destructive,
    "--destructive-foreground": theme.colors.destructiveForeground,
    "--border": theme.colors.border,
    "--input": theme.colors.input,
    "--ring": theme.colors.ring,
    "--success": theme.colors.success,
    "--success-foreground": theme.colors.successForeground,
    "--warning": theme.colors.warning,
    "--warning-foreground": theme.colors.warningForeground,
    "--info": theme.colors.info,
    "--info-foreground": theme.colors.infoForeground,
    "--radius": theme.borderRadius.md,
  };
}

// Theme Utilities
export function getThemeColors(themeName: ThemeName) {
  return themes[themeName].colors;
}

export function isValidTheme(themeName: string): themeName is ThemeName {
  return themeName in themes;
}

export function getContrastColor(backgroundColor: string): string {
  // Simple contrast calculation - in a real app, you might want a more sophisticated algorithm
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? colors.neutral[900] : colors.neutral[50];
}

// Theme Presets for specific use cases
export const themePresets = {
  dashboard: {
    light: {
      ...lightTheme,
      colors: {
        ...lightTheme.colors,
        background: colors.neutral[100],
        card: colors.neutral[50],
      },
    },
    dark: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        background: colors.neutral[900],
        card: colors.neutral[800],
      },
    },
  },

  marketing: {
    light: {
      ...lightTheme,
      colors: {
        ...lightTheme.colors,
        primary: colors.primary[500],
        accent: colors.primary[100],
      },
    },
    dark: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        primary: colors.primary[400],
        accent: colors.primary[900],
      },
    },
  },

  minimal: {
    light: {
      ...lightTheme,
      colors: {
        ...lightTheme.colors,
        background: colors.neutral[50],
        card: colors.neutral[50],
        border: colors.neutral[100],
      },
    },
    dark: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        background: colors.neutral[950],
        card: colors.neutral[950],
        border: colors.neutral[900],
      },
    },
  },
} as const;

export type ThemePreset = keyof typeof themePresets;
