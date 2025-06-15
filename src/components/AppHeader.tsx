import React, { useState } from 'react';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { GlobalSearch } from '@/components/GlobalSearch';
import { UserProfileButton } from '@/components/UserProfileButton';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import { CreateWorkspaceDialog } from '@/components/CreateWorkspaceDialog';
import { WorkspaceMembersDialog } from '@/components/WorkspaceMembersDialog';
import { FileItem } from '@/types';

interface AppHeaderProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onShowSettings: () => void;
  files: FileItem[];
  onNavigateToFile: (fileId: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  onViewChange,
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onShowSettings,
  files,
  onNavigateToFile,
}) => {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showWorkspaceMembers, setShowWorkspaceMembers] = useState(false);

  const handleViewChange = (view: ViewMode) => {
    console.log('[AppHeader] View change requested:', view);
    onViewChange(view);
  };

  return (
    <>
      <header className="glass-effect border-b border-border/40 px-2 md:px-4 lg:px-6 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4 sticky top-0 z-40 animate-slide-up min-h-[60px]">
        {/* Left Section - Brand & Workspace */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xs md:text-sm">📋</span>
            </div>
            <div className="min-w-0 hidden sm:block">
              <span className="text-sm md:text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent truncate block">
                NotesFlow
              </span>
              <span className="text-xs text-muted-foreground hidden lg:block">
                Workspace inteligente
              </span>
            </div>
          </div>
          
          {/* Workspace Selector - Hidden on mobile and tablet */}
          {!isMobile && (
            <div className="hidden xl:block">
              <WorkspaceSelector 
                onCreateWorkspace={() => setShowCreateWorkspace(true)}
                onManageWorkspace={() => setShowWorkspaceMembers(true)}
              />
            </div>
          )}
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-2">
          <GlobalSearch 
            files={files}
            onSelectResult={onNavigateToFile}
            placeholder="Buscar notas, templates..."
            className="w-full"
          />
        </div>

        {/* Right Section - Navigation & Profile */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {/* Navigation Tabs - Responsivo */}
          <div className="hidden lg:block">
            <ViewTabs 
              activeView={activeView} 
              onViewChange={handleViewChange} 
              isMobile={false}
              className="shadow-sm"
            />
          </div>
          
          {/* Navigation Tabs - Compacto para tablets */}
          <div className="hidden md:block lg:hidden">
            <ViewTabs 
              activeView={activeView} 
              onViewChange={handleViewChange} 
              isMobile={true}
              className="shadow-sm"
            />
          </div>
          
          {/* Profile Button */}
          <UserProfileButton 
            onShowSettings={onShowSettings}
            className="shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
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
