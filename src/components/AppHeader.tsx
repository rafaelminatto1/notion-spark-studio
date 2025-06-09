import React, { useState } from 'react';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { GlobalSearch } from '@/components/GlobalSearch';
import { UserProfileButton } from '@/components/UserProfileButton';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import { CreateWorkspaceDialog } from '@/components/CreateWorkspaceDialog';
import { WorkspaceMembersDialog } from '@/components/WorkspaceMembersDialog';
import { useFileSystemContext } from '@/contexts/FileSystemContext';

interface AppHeaderProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onShowSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  onViewChange,
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onShowSettings
}) => {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showWorkspaceMembers, setShowWorkspaceMembers] = useState(false);

  const {
    files,
    navigateTo: onFileSelect,
  } = useFileSystemContext();

  const handleViewChange = (view: ViewMode) => {
    console.log('[AppHeader] View change requested:', view);
    onViewChange(view);
  };

  return (
    <>
      <header className="glass-effect border-b border-border/40 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 md:gap-6 sticky top-0 z-50 animate-slide-up">
        {/* Left Section - Brand & Workspace */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {/* Brand */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm md:text-base">📋</span>
            </div>
            <div className="min-w-0">
              <span className="text-base md:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent truncate block">
                NotesFlow
              </span>
              <span className="text-xs text-muted-foreground hidden md:block">
                Workspace inteligente
              </span>
            </div>
          </div>
          
          {/* Workspace Selector - Hidden on mobile */}
          {!isMobile && (
            <WorkspaceSelector 
              onCreateWorkspace={() => setShowCreateWorkspace(true)}
              onManageWorkspace={() => setShowWorkspaceMembers(true)}
            />
          )}
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xs md:max-w-lg mx-2 md:mx-4">
          <GlobalSearch 
            files={files}
            onFileSelect={onFileSelect}
            placeholder="Buscar notas, templates..."
          />
        </div>

        {/* Right Section - Navigation & Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Navigation Tabs - Hidden on small mobile screens */}
          <div className="hidden sm:block">
            <ViewTabs 
              activeView={activeView} 
              onViewChange={handleViewChange} 
              isMobile={isMobile}
              className="shadow-sm"
            />
          </div>
          
          {/* Profile Button */}
          <UserProfileButton 
            onShowSettings={onShowSettings}
            className="shadow-sm hover:shadow-md transition-shadow"
          />
        </div>
      </header>

      {/* Dialogs */}
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
