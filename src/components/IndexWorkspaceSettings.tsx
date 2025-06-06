
import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { WorkspaceSettings } from '@/components/WorkspaceSettings';
import { UserProfileButton } from '@/components/UserProfileButton';
import { Button } from '@/components/ui/button';

interface IndexWorkspaceSettingsProps {
  onClose: () => void;
  onShowSettings: () => void;
}

export const IndexWorkspaceSettings: React.FC<IndexWorkspaceSettingsProps> = ({
  onClose,
  onShowSettings
}) => {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onClose}
            >
              ← Voltar
            </Button>
            <h1 className="text-lg font-semibold">Configurações do Workspace</h1>
            <UserProfileButton onShowSettings={onShowSettings} />
          </div>
          <WorkspaceSettings />
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};
