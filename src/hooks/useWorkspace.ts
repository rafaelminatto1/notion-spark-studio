
import { useState, useEffect, createContext, useContext } from 'react';
import { WorkspaceLayout, PanelConfig, WorkspaceSettings, CustomTheme } from '@/types/workspace';

const DEFAULT_WORKSPACE: WorkspaceLayout = {
  id: 'default',
  name: 'Workspace Padrão',
  panels: [
    {
      id: 'sidebar',
      type: 'sidebar',
      position: 'left',
      size: 25,
      minSize: 15,
      maxSize: 40,
      isVisible: true,
      isCollapsible: true,
      title: 'Explorador'
    },
    {
      id: 'main',
      type: 'editor',
      position: 'center',
      size: 60,
      minSize: 30,
      isVisible: true,
      isCollapsible: false,
      title: 'Editor'
    },
    {
      id: 'properties',
      type: 'custom',
      position: 'right',
      size: 15,
      minSize: 10,
      maxSize: 30,
      isVisible: false,
      isCollapsible: true,
      title: 'Propriedades'
    }
  ],
  theme: 'dark',
  settings: {
    fontSize: 14,
    lineHeight: 1.5,
    autoSave: true,
    showLineNumbers: true,
    wordWrap: true,
    minimap: false,
    animations: true,
    compactMode: false,
    showBreadcrumbs: true,
    sidebarPosition: 'left',
    toolbarPosition: 'top'
  }
};

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

export const useWorkspace = () => {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceLayout>(DEFAULT_WORKSPACE);
  const [savedWorkspaces, setSavedWorkspaces] = useState<WorkspaceLayout[]>([DEFAULT_WORKSPACE]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(CUSTOM_THEMES);

  // Load workspace from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notion-workspace');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCurrentWorkspace(data.current || DEFAULT_WORKSPACE);
        setSavedWorkspaces(data.saved || [DEFAULT_WORKSPACE]);
        setCustomThemes(data.themes || CUSTOM_THEMES);
      } catch (error) {
        console.error('Error loading workspace:', error);
      }
    }
  }, []);

  // Save workspace to localStorage
  useEffect(() => {
    const data = {
      current: currentWorkspace,
      saved: savedWorkspaces,
      themes: customThemes
    };
    localStorage.setItem('notion-workspace', JSON.stringify(data));
  }, [currentWorkspace, savedWorkspaces, customThemes]);

  const updatePanel = (panelId: string, updates: Partial<PanelConfig>) => {
    setCurrentWorkspace(prev => ({
      ...prev,
      panels: prev.panels.map(panel =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      )
    }));
  };

  const togglePanel = (panelId: string) => {
    updatePanel(panelId, {
      isVisible: !currentWorkspace.panels.find(p => p.id === panelId)?.isVisible
    });
  };

  const resizePanel = (panelId: string, newSize: number) => {
    updatePanel(panelId, { size: Math.max(0, Math.min(100, newSize)) });
  };

  const updateSettings = (updates: Partial<WorkspaceSettings>) => {
    setCurrentWorkspace(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }));
  };

  const saveWorkspace = (name: string) => {
    const newWorkspace = {
      ...currentWorkspace,
      id: Date.now().toString(),
      name
    };
    setSavedWorkspaces(prev => [...prev, newWorkspace]);
  };

  const loadWorkspace = (workspaceId: string) => {
    const workspace = savedWorkspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  const deleteWorkspace = (workspaceId: string) => {
    setSavedWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
  };

  const createCustomTheme = (theme: Omit<CustomTheme, 'id'>) => {
    const newTheme = {
      ...theme,
      id: Date.now().toString()
    };
    setCustomThemes(prev => [...prev, newTheme]);
    return newTheme.id;
  };

  const resetToDefault = () => {
    setCurrentWorkspace(DEFAULT_WORKSPACE);
  };

  return {
    currentWorkspace,
    savedWorkspaces,
    customThemes,
    updatePanel,
    togglePanel,
    resizePanel,
    updateSettings,
    saveWorkspace,
    loadWorkspace,
    deleteWorkspace,
    createCustomTheme,
    resetToDefault
  };
};

export const WorkspaceContext = createContext<ReturnType<typeof useWorkspace> | null>(null);

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  }
  return context;
};
