
import { useCallback } from 'react';
import { WorkspaceLayout, PanelConfig, WorkspaceSettings } from '@/types/workspace';

interface UseWorkspaceActionsProps {
  currentWorkspace: WorkspaceLayout;
  setCurrentWorkspace: (workspace: WorkspaceLayout) => void;
  savedWorkspaces: WorkspaceLayout[];
  setSavedWorkspaces: (workspaces: WorkspaceLayout[]) => void;
  DEFAULT_WORKSPACE: WorkspaceLayout;
}

export const useWorkspaceActions = ({
  currentWorkspace,
  setCurrentWorkspace,
  savedWorkspaces,
  setSavedWorkspaces,
  DEFAULT_WORKSPACE
}: UseWorkspaceActionsProps) => {
  const updatePanel = useCallback((panelId: string, updates: Partial<PanelConfig>) => {
    setCurrentWorkspace({
      ...currentWorkspace,
      panels: currentWorkspace.panels.map(panel =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      )
    });
  }, [currentWorkspace, setCurrentWorkspace]);

  const togglePanel = useCallback((panelId: string) => {
    updatePanel(panelId, {
      isVisible: !currentWorkspace.panels.find(p => p.id === panelId)?.isVisible
    });
  }, [currentWorkspace.panels, updatePanel]);

  const updatePanelVisibility = useCallback((panelId: string, isVisible: boolean) => {
    updatePanel(panelId, { isVisible });
  }, [updatePanel]);

  const resizePanel = useCallback((panelId: string, newSize: number) => {
    updatePanel(panelId, { size: Math.max(0, Math.min(100, newSize)) });
  }, [updatePanel]);

  const updateSettings = useCallback((updates: Partial<WorkspaceSettings>) => {
    setCurrentWorkspace({
      ...currentWorkspace,
      settings: { ...currentWorkspace.settings, ...updates }
    });
  }, [currentWorkspace, setCurrentWorkspace]);

  const updateWorkspaceSettings = updateSettings;

  const saveWorkspace = useCallback((name: string) => {
    const newWorkspace = {
      ...currentWorkspace,
      id: Date.now().toString(),
      name
    };
    setSavedWorkspaces([...savedWorkspaces, newWorkspace]);
    return newWorkspace.id;
  }, [currentWorkspace, savedWorkspaces, setSavedWorkspaces]);

  const loadWorkspace = useCallback((workspaceId: string) => {
    const workspace = savedWorkspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      return true;
    }
    return false;
  }, [savedWorkspaces, setCurrentWorkspace]);

  const deleteWorkspace = useCallback((workspaceId: string) => {
    setSavedWorkspaces(savedWorkspaces.filter(w => w.id !== workspaceId));
  }, [savedWorkspaces, setSavedWorkspaces]);

  const resetToDefault = useCallback(() => {
    setCurrentWorkspace(DEFAULT_WORKSPACE);
  }, [setCurrentWorkspace, DEFAULT_WORKSPACE]);

  const duplicateWorkspace = useCallback((workspaceId: string, newName: string) => {
    const workspace = savedWorkspaces.find(w => w.id === workspaceId);
    if (workspace) {
      const duplicatedWorkspace = {
        ...workspace,
        id: Date.now().toString(),
        name: newName
      };
      setSavedWorkspaces([...savedWorkspaces, duplicatedWorkspace]);
      return duplicatedWorkspace.id;
    }
    return null;
  }, [savedWorkspaces, setSavedWorkspaces]);

  const exportWorkspace = useCallback((workspaceId?: string) => {
    const workspace = workspaceId 
      ? savedWorkspaces.find(w => w.id === workspaceId)
      : currentWorkspace;
    
    if (workspace) {
      const dataStr = JSON.stringify(workspace, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `workspace-${workspace.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  }, [savedWorkspaces, currentWorkspace]);

  const importWorkspace = useCallback((file: File) => {
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workspace = JSON.parse(e.target?.result as string) as WorkspaceLayout;
          workspace.id = Date.now().toString(); // New ID to avoid conflicts
          setSavedWorkspaces([...savedWorkspaces, workspace]);
          resolve(workspace.id);
        } catch (error) {
          console.error('Error importing workspace:', error);
          resolve(null);
        }
      };
      reader.readAsText(file);
    });
  }, [savedWorkspaces, setSavedWorkspaces]);

  return {
    updatePanel,
    togglePanel,
    updatePanelVisibility,
    resizePanel,
    updateSettings,
    updateWorkspaceSettings,
    saveWorkspace,
    loadWorkspace,
    deleteWorkspace,
    resetToDefault,
    duplicateWorkspace,
    exportWorkspace,
    importWorkspace
  };
};
