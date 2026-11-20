import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme-mode';

export const palette = {
  primary: {
    lighter: '#D0ECFE',
    light: '#73BAFB',
    main: '#1877F2',
    dark: '#0C44AE',
    darker: '#042174',
    contrastText: '#FFFFFF',
  },
  secondary: {
    lighter: '#EFD6FF',
    light: '#C684FF',
    main: '#8E33FF',
    dark: '#5119B7',
    darker: '#27097A',
    contrastText: '#FFFFFF',
  },
  info: {
    lighter: '#CAFDF5',
    light: '#61F3F3',
    main: '#00B8D9',
    dark: '#006C9C',
    darker: '#003768',
    contrastText: '#FFFFFF',
  },
  success: {
    lighter: '#D3FCD2',
    light: '#77ED8B',
    main: '#22C55E',
    dark: '#118D57',
    darker: '#065E49',
    contrastText: '#FFFFFF',
  },
  warning: {
    lighter: '#FFF5CC',
    light: '#FFD666',
    main: '#FFAB00',
    dark: '#B76E00',
    darker: '#7A4100',
    contrastText: '#1C252E',
  },
  error: {
    lighter: '#FFE9D5',
    light: '#FFAC82',
    main: '#FF5630',
    dark: '#B71D18',
    darker: '#7A0916',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#FCFDFD',
    100: '#F9FAFB',
    200: '#F4F6F8',
    300: '#DFE3E8',
    400: '#C4CDD5',
    500: '#919EAB',
    600: '#637381',
    700: '#454F5B',
    800: '#1C252E',
    900: '#141A21',
    950: '#0D1015',
  },
};

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof palette & {
    background: {
      default: string;
      paper: string;
      neutral: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    divider: string;
    border: string;
  };
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<AppTheme | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setMode(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  };

  const toggleTheme = () => {
    setThemeMode(mode === 'light' ? 'dark' : 'light');
  };

  const value = useMemo<AppTheme>(() => {
    const isDark = mode === 'dark';
    return {
      mode,
      isDark,
      colors: {
        ...palette,
        background: isDark
          ? {
              default: '#0D1015',
              paper: '#141A21',
              neutral: '#1C252E',
            }
          : {
              default: '#EBEBEB',
              paper: '#F5F5F5',
              neutral: '#F4F6F8',
            },
        text: isDark
          ? {
              primary: '#F4F6F8',
              secondary: '#C4CDD5',
              disabled: '#637381',
            }
          : {
              primary: '#1C252E',
              secondary: '#637381',
              disabled: '#919EAB',
            },
        divider: isDark ? 'rgba(145, 158, 171, 0.2)' : 'rgba(145, 158, 171, 0.2)',
        border: isDark ? 'rgba(145, 158, 171, 0.16)' : 'rgba(145, 158, 171, 0.16)',
      },
      toggleTheme,
      setThemeMode,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
}
