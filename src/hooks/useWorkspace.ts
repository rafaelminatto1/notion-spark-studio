
import { createContext, useContext } from 'react';
import { useWorkspaceState } from './useWorkspaceState';
import { useWorkspaceActions } from './useWorkspaceActions';
import { useWorkspaceThemes } from './useWorkspaceThemes';

export const useWorkspace = () => {
  const workspaceState = useWorkspaceState();
  const { customThemes, setCustomThemes, createCustomTheme } = useWorkspaceThemes();
  const workspaceActions = useWorkspaceActions(workspaceState);

  return {
    ...workspaceState,
    ...workspaceActions,
    customThemes,
    setCustomThemes,
    createCustomTheme
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
