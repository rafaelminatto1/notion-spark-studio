
import { useEffect } from 'react';
import { CustomTheme } from '@/types/workspace';

export const useThemeApplicator = (activeTheme?: CustomTheme) => {
  useEffect(() => {
    if (!activeTheme) return;

    const root = document.documentElement;
    
    // Apply colors as CSS custom properties
    Object.entries(activeTheme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case for CSS variables
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--theme-${cssKey}`, value);
    });

    // Apply typography
    root.style.setProperty('--theme-font-family', activeTheme.typography.fontFamily);
    root.style.setProperty('--theme-font-size', `${activeTheme.typography.fontSize}px`);
    root.style.setProperty('--theme-font-weight', activeTheme.typography.fontWeight.toString());

    // Apply to workspace variables for compatibility
    root.style.setProperty('--workspace-bg', activeTheme.colors.background);
    root.style.setProperty('--workspace-surface', activeTheme.colors.surface);
    root.style.setProperty('--workspace-border', activeTheme.colors.border);
    root.style.setProperty('--workspace-text', activeTheme.colors.text);
    root.style.setProperty('--workspace-text-muted', activeTheme.colors.textSecondary);

    // Apply to Tailwind CSS variables
    const hslFromHex = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Update primary Tailwind variables
    root.style.setProperty('--primary', hslFromHex(activeTheme.colors.primary));
    root.style.setProperty('--secondary', hslFromHex(activeTheme.colors.secondary));
    root.style.setProperty('--background', hslFromHex(activeTheme.colors.background));
    root.style.setProperty('--foreground', hslFromHex(activeTheme.colors.text));
    root.style.setProperty('--accent', hslFromHex(activeTheme.colors.accent));
    root.style.setProperty('--border', hslFromHex(activeTheme.colors.border));

    return () => {
      // Cleanup function to remove theme variables if needed
      Object.keys(activeTheme.colors).forEach(key => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.removeProperty(`--theme-${cssKey}`);
      });
    };
  }, [activeTheme]);

  const applyTheme = (theme: CustomTheme) => {
    // This function can be called to manually apply a theme
    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--theme-${cssKey}`, value);
    });

    root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
    root.style.setProperty('--theme-font-size', `${theme.typography.fontSize}px`);
    root.style.setProperty('--theme-font-weight', theme.typography.fontWeight.toString());
  };

  const removeTheme = () => {
    // Remove all theme-related CSS variables
    const root = document.documentElement;
    const style = root.style;
    
    for (let i = style.length - 1; i >= 0; i--) {
      const property = style[i];
      if (property.startsWith('--theme-')) {
        style.removeProperty(property);
      }
    }
  };

  return {
    applyTheme,
    removeTheme
  };
};
