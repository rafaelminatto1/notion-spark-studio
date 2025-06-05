
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

  const resizePanel = useCallback((panelId: string, newSize: number) => {
    updatePanel(panelId, { size: Math.max(0, Math.min(100, newSize)) });
  }, [updatePanel]);

  const updateSettings = useCallback((updates: Partial<WorkspaceSettings>) => {
    setCurrentWorkspace({
      ...currentWorkspace,
      settings: { ...currentWorkspace.settings, ...updates }
    });
  }, [currentWorkspace, setCurrentWorkspace]);

  const saveWorkspace = useCallback((name: string) => {
    const newWorkspace = {
      ...currentWorkspace,
      id: Date.now().toString(),
      name
    };
    setSavedWorkspaces([...savedWorkspaces, newWorkspace]);
  }, [currentWorkspace, savedWorkspaces, setSavedWorkspaces]);

  const loadWorkspace = useCallback((workspaceId: string) => {
    const workspace = savedWorkspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  }, [savedWorkspaces, setCurrentWorkspace]);

  const deleteWorkspace = useCallback((workspaceId: string) => {
    setSavedWorkspaces(savedWorkspaces.filter(w => w.id !== workspaceId));
  }, [savedWorkspaces, setSavedWorkspaces]);

  const resetToDefault = useCallback(() => {
    setCurrentWorkspace(DEFAULT_WORKSPACE);
  }, [setCurrentWorkspace, DEFAULT_WORKSPACE]);

  return {
    updatePanel,
    togglePanel,
    resizePanel,
    updateSettings,
    saveWorkspace,
    loadWorkspace,
    deleteWorkspace,
    resetToDefault
  };
};
