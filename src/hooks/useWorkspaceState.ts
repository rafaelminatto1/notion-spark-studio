
import { useState, useEffect, createContext, useContext } from 'react';
import type { WorkspaceLayout} from '@/types/workspace';
import { PanelConfig, WorkspaceSettings } from '@/types/workspace';

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

export const useWorkspaceState = () => {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceLayout>(DEFAULT_WORKSPACE);
  const [savedWorkspaces, setSavedWorkspaces] = useState<WorkspaceLayout[]>([DEFAULT_WORKSPACE]);

  // Load workspace from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notion-workspace');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCurrentWorkspace(data.current || DEFAULT_WORKSPACE);
        setSavedWorkspaces(data.saved || [DEFAULT_WORKSPACE]);
      } catch (error) {
        console.error('Error loading workspace:', error);
      }
    }
  }, []);

  // Save workspace to localStorage
  useEffect(() => {
    const data = {
      current: currentWorkspace,
      saved: savedWorkspaces
    };
    localStorage.setItem('notion-workspace', JSON.stringify(data));
  }, [currentWorkspace, savedWorkspaces]);

  return {
    currentWorkspace,
    setCurrentWorkspace,
    savedWorkspaces,
    setSavedWorkspaces,
    DEFAULT_WORKSPACE
  };
};
