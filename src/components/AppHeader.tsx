
import React from 'react';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { GlobalSearch } from '@/components/GlobalSearch';
import { UserProfileButton } from '@/components/UserProfileButton';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import { CreateWorkspaceDialog } from '@/components/CreateWorkspaceDialog';
import { WorkspaceMembersDialog } from '@/components/WorkspaceMembersDialog';
import { FileItem } from '@/types';
import { useState } from 'react';

interface AppHeaderProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  files: FileItem[];
  onFileSelect: (fileId: string) => void;
  onShowSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  onViewChange,
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  files,
  onFileSelect,
  onShowSettings
}) => {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showWorkspaceMembers, setShowWorkspaceMembers] = useState(false);

  return (
    <>
      <header className="bg-background border-b border-border/60 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-sm bg-background/95">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              📋 NotesFlow
            </span>
          </div>
          
          <WorkspaceSelector 
            onCreateWorkspace={() => setShowCreateWorkspace(true)}
            onManageWorkspace={() => setShowWorkspaceMembers(true)}
          />
        </div>

        <div className="flex-1 max-w-md">
          <GlobalSearch files={files} onFileSelect={onFileSelect} />
        </div>

        <div className="flex items-center gap-2">
          <ViewTabs 
            activeView={activeView} 
            onViewChange={onViewChange} 
            isMobile={isMobile}
          />
          <UserProfileButton onShowSettings={onShowSettings} />
        </div>
      </header>

      <CreateWorkspaceDialog 
        open={showCreateWorkspace}
        onOpenChange={setShowCreateWorkspace}
      />

      <WorkspaceMembersDialog 
        open={showWorkspaceMembers}
        onOpenChange={setShowWorkspaceMembers}
      />
    </>
  );
};
