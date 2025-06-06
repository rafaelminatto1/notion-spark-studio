
import React from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { AppHeader } from '@/components/AppHeader';
import { FileItem } from '@/types';

interface IndexMainContentProps {
  activeView: ViewMode;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  convertedFiles: FileItem[];
  favorites: string[];
  currentFileId: string | null;
  setCurrentFileId: (id: string | null) => void;
  navigateTo: (fileId: string) => void;
  setActiveView: (view: ViewMode) => void;
  onShowSettings: () => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  isQuickSwitcherOpen: boolean;
  closeQuickSwitcher: () => void;
  filteredCommands: any[];
  quickSwitcherQuery: string;
  setQuickSwitcherQuery: (query: string) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

export const IndexMainContent: React.FC<IndexMainContentProps> = ({
  activeView,
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  convertedFiles,
  favorites,
  currentFileId,
  setCurrentFileId,
  navigateTo,
  setActiveView,
  onShowSettings,
  onCreateFile,
  isQuickSwitcherOpen,
  closeQuickSwitcher,
  filteredCommands,
  quickSwitcherQuery,
  setQuickSwitcherQuery,
  isCommandPaletteOpen,
  setIsCommandPaletteOpen
}) => {
  // Create wrapper function for AppHeader that accepts string and converts to ViewMode
  const handleViewChangeFromHeader = (view: string) => {
    setActiveView(view as ViewMode);
  };

  // Create wrapper function for WorkspaceLayout that accepts string and converts to ViewMode
  const handleViewChangeFromWorkspace = (view: string) => {
    setActiveView(view as ViewMode);
  };

  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background text-foreground flex w-full">
          {/* Mobile Sidebar Backdrop */}
          {isMobile && isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onToggleMobileSidebar}
            />
          )}
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <AppHeader
              activeView={activeView}
              onViewChange={handleViewChangeFromHeader}
              isMobile={isMobile}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onToggleMobileSidebar={onToggleMobileSidebar}
              files={convertedFiles}
              onFileSelect={(fileId: string) => {
                setCurrentFileId(fileId);
                navigateTo(fileId);
                setActiveView('editor');
              }}
              onShowSettings={onShowSettings}
            />

            {/* Content Area */}
            <WorkspaceLayout
              activeView={activeView}
              onViewChange={handleViewChangeFromWorkspace}
              onNavigateToFile={(fileId: string) => {
                setCurrentFileId(fileId);
                navigateTo(fileId);
                setActiveView('editor');
              }}
              onCreateFile={onCreateFile}
            />
          </div>

          {/* Quick Switcher */}
          <QuickSwitcher
            isOpen={isQuickSwitcherOpen}
            onClose={closeQuickSwitcher}
            commands={filteredCommands}
            query={quickSwitcherQuery}
            onQueryChange={setQuickSwitcherQuery}
          />

          {/* Command Palette */}
          <CommandPalette
            files={convertedFiles}
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onFileSelect={(fileId: string) => {
              setCurrentFileId(fileId);
              navigateTo(fileId);
              setActiveView('editor');
            }}
            onCreateFile={onCreateFile}
            favorites={favorites}
          />
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};
