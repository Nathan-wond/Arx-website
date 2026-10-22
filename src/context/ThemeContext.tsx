import React, { createContext, useContext, useEffect, useState } from 'react';
import { themeState, events } from '../vanilla/state.js';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('arx_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
  };

  // Listen for theme changes from vanilla panels
  useEffect(() => {
    const unsubscribe = events.on('themeChange', (newTheme: any) => {
      if (newTheme === 'dark' || newTheme === 'light') {
        setThemeState(newTheme);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('arx_theme', theme);
    } catch {}
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    themeState.setTheme(next);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      themeState.setTheme(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
