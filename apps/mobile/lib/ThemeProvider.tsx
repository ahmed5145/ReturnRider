import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { type ThemeColors, type ThemeMode, paletteForMode } from './themes';

const STORAGE_KEY = 'theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void SecureStore.setItemAsync(STORAGE_KEY, next);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      mode,
      colors: paletteForMode(mode),
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode],
  );

  if (!ready) {
    return (
      <ThemeContext.Provider
        value={{
          mode: 'dark',
          colors: paletteForMode('dark'),
          setMode: () => {},
          toggleMode: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'dark',
      colors: paletteForMode('dark'),
      setMode: () => {},
      toggleMode: () => {},
    };
  }
  return ctx;
}
