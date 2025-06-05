
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setActualTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setActualTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', actualTheme === 'dark');
    
    // Add smooth theme transition
    root.style.setProperty('--theme-transition', 'all 0.3s ease');
    
    // Apply workspace theme colors if available
    if (actualTheme === 'dark') {
      root.style.setProperty('--workspace-bg', '#0f0f0f');
      root.style.setProperty('--workspace-surface', '#1a1a1a');
      root.style.setProperty('--workspace-border', '#282828');
      root.style.setProperty('--workspace-text', '#ffffff');
      root.style.setProperty('--workspace-text-muted', '#a1a1a1');
    } else {
      root.style.setProperty('--workspace-bg', '#ffffff');
      root.style.setProperty('--workspace-surface', '#f8f9fa');
      root.style.setProperty('--workspace-border', '#e5e7eb');
      root.style.setProperty('--workspace-text', '#1f2937');
      root.style.setProperty('--workspace-text-muted', '#6b7280');
    }
  }, [actualTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      <div className="transition-colors duration-300">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
