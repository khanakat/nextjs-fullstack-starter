"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Theme,
  ThemeName,
  themes,
  generateCSSVariables,
} from "@/lib/design-system/theme";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
}

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  toggleTheme: () => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "ui-theme",
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as ThemeName;
    if (stored && stored in themes) {
      setThemeName(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const theme = themes[themeName];
    const cssVariables = generateCSSVariables(theme);

    // Apply CSS variables to root
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update data attributes for CSS selectors
    root.setAttribute("data-theme", themeName);
    root.classList.remove("light", "dark");
    root.classList.add(themeName === "dark" ? "dark" : "light");

    // Store theme preference
    localStorage.setItem(storageKey, themeName);
  }, [themeName, mounted, storageKey]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme);
  };

  const toggleTheme = () => {
    setThemeName((current) => (current === "dark" ? "light" : "dark"));
  };

  const value: ThemeContextType = {
    theme: themes[themeName],
    themeName,
    setTheme,
    toggleTheme,
    availableThemes: Object.keys(themes) as ThemeName[],
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Theme-aware component wrapper
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>,
) {
  return function ThemedComponent(props: P) {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
}

// CSS-in-JS style generator
export function createThemeStyles(themeName: ThemeName) {
  const theme = themes[themeName];
  return {
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    shadows: theme.shadows,
    borderRadius: theme.borderRadius,
  };
}
