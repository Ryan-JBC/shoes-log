import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { darkColors, DEFAULT_ACCENT } from './colors';
import { getSetting, setSetting } from '../db/settings';

interface ThemeValue {
  colors: typeof darkColors;
  accent: string;
  setAccent: (c: string) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  useEffect(() => {
    getSetting('accent_color')
      .then((v) => { if (v) setAccentState(v); })
      .catch(() => {});
  }, []);

  function setAccent(c: string) {
    setAccentState(c);
    setSetting('accent_color', c).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ colors: darkColors, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
