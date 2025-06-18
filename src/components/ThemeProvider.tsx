
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CustomTheme } from '@/types/workspace';
import { useWorkspaceThemes } from '@/hooks/useWorkspaceThemes';
import { useThemeApplicator } from '@/hooks/useThemeApplicator';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
  customTheme?: CustomTheme;
  setCustomTheme: (theme?: CustomTheme) => void;
  availableThemes: CustomTheme[];
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
  const [customTheme, setCustomTheme] = useState<CustomTheme | undefined>();
  const { customThemes } = useWorkspaceThemes();
  
  // Apply custom theme when selected
  useThemeApplicator(customTheme);

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    const storedCustomTheme = localStorage.getItem('custom-theme');
    
    if (stored) {
      setTheme(stored);
    }
    
    if (storedCustomTheme) {
      try {
        const parsed = JSON.parse(storedCustomTheme);
        setCustomTheme(parsed);
      } catch (error) {
        console.error('Error parsing stored custom theme:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (customTheme) {
      localStorage.setItem('custom-theme', JSON.stringify(customTheme));
    } else {
      localStorage.removeItem('custom-theme');
    }
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setActualTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => { mediaQuery.removeEventListener('change', handler); };
    } else {
      setActualTheme(theme);
    }
  }, [theme, customTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', actualTheme === 'dark');
    
    // Add smooth theme transition
    root.style.setProperty('--theme-transition', 'all 0.3s ease');
    
    // Apply default workspace theme colors if no custom theme is active
    if (!customTheme) {
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
    }
  }, [actualTheme, customTheme]);

  const handleSetCustomTheme = (newTheme?: CustomTheme) => {
    setCustomTheme(newTheme);
    
    if (newTheme) {
      // When setting a custom theme, we typically want to use 'light' or 'dark' base
      // depending on the background color brightness
      const bgColor = newTheme.colors.background;
      const rgb = parseInt(bgColor.slice(1), 16);
      const brightness = ((rgb >> 16) & 255) * 0.299 + ((rgb >> 8) & 255) * 0.587 + (rgb & 255) * 0.114;
      setTheme(brightness > 128 ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      actualTheme, 
      customTheme, 
      setCustomTheme: handleSetCustomTheme,
      availableThemes: customThemes
    }}>
      <div 
        className="transition-colors duration-300"
        style={{
          fontFamily: customTheme?.typography.fontFamily,
          fontSize: customTheme?.typography.fontSize ? `${customTheme.typography.fontSize}px` : undefined,
          fontWeight: customTheme?.typography.fontWeight
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
