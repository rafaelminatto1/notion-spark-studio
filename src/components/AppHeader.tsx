
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
      <header className="bg-background/95 backdrop-blur-sm border-b border-border/60 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <span className="text-sm md:text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent truncate">
              📋 NotesFlow
            </span>
          </div>
          
          {!isMobile && (
            <WorkspaceSelector 
              onCreateWorkspace={() => setShowCreateWorkspace(true)}
              onManageWorkspace={() => setShowWorkspaceMembers(true)}
            />
          )}
        </div>

        {/* Search - Responsive */}
        <div className="flex-1 max-w-xs md:max-w-md">
          <GlobalSearch files={files} onFileSelect={onFileSelect} />
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Hide tabs on small mobile screens */}
          <div className="hidden sm:block">
            <ViewTabs 
              activeView={activeView} 
              onViewChange={onViewChange} 
              isMobile={isMobile}
            />
          </div>
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
