
import React from 'react';
import { WorkspaceContext, useWorkspace } from '@/hooks/useWorkspace';

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const workspace = useWorkspace();

  return (
    <WorkspaceContext.Provider value={workspace}>
      {children}
    </WorkspaceContext.Provider>
  );
};
