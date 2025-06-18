
import { useState, useEffect } from 'react';
import type { CustomTheme } from '@/types/workspace';

const CUSTOM_THEMES: CustomTheme[] = [
  {
    id: 'notion-dark',
    name: 'Notion Dark',
    colors: {
      primary: '#7c3aed',
      secondary: '#4f46e5',
      background: '#191919',
      surface: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#a1a1a1',
      border: '#404040',
      accent: '#8b5cf6'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      fontWeight: 400
    }
  },
  {
    id: 'notion-light',
    name: 'Notion Light',
    colors: {
      primary: '#7c3aed',
      secondary: '#4f46e5',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      accent: '#8b5cf6'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      fontWeight: 400
    }
  },
  {
    id: 'github',
    name: 'GitHub',
    colors: {
      primary: '#0969da',
      secondary: '#218bff',
      background: '#0d1117',
      surface: '#161b22',
      text: '#f0f6fc',
      textSecondary: '#8b949e',
      border: '#30363d',
      accent: '#f78166'
    },
    typography: {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Menlo, monospace',
      fontSize: 13,
      fontWeight: 400
    }
  }
];

export const useWorkspaceThemes = () => {
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(CUSTOM_THEMES);

  useEffect(() => {
    const saved = localStorage.getItem('notion-workspace');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCustomThemes(data.themes || CUSTOM_THEMES);
      } catch (error) {
        console.error('Error loading themes:', error);
      }
    }
  }, []);

  const createCustomTheme = (name: string) => {
    const newTheme: CustomTheme = {
      id: Date.now().toString(),
      name,
      colors: {
        primary: '#7c3aed',
        secondary: '#4f46e5',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        accent: '#8b5cf6'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 14,
        fontWeight: 400
      }
    };
    setCustomThemes(prev => [...prev, newTheme]);
    return newTheme.id;
  };

  return {
    customThemes,
    setCustomThemes,
    createCustomTheme
  };
};
