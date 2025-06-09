
import React, { useState } from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { AppHeader } from '@/components/AppHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { FileItem } from '@/types';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoCloseToast } from '@/hooks/useAutoCloseToast';

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
  const [loginSuccessToast, setLoginSuccessToast] = useState(false);

  // Auto-close login success toast
  useAutoCloseToast({
    message: "Login realizado com sucesso! Bem-vindo de volta.",
    type: "success",
    duration: 3000,
    trigger: loginSuccessToast
  });

  const handleViewChangeFromHeader = (view: ViewMode) => {
    console.log('[IndexMainContent] Header view change:', view);
    setActiveView(view);
  };

  const handleViewChangeFromWorkspace = (view: string) => {
    console.log('[IndexMainContent] Workspace view change:', view);
    setActiveView(view as ViewMode);
  };

  const handleFileSelect = (fileId: string) => {
    console.log('[IndexMainContent] File selected:', fileId);
    setCurrentFileId(fileId);
    navigateTo(fileId);
    setActiveView('editor');
    if (isMobile) {
      onToggleMobileSidebar(); // Close sidebar on mobile after selection
    }
  };

  const handleCreateFile = async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    const fileId = await onCreateFile(name, parentId, type);
    if (fileId && type === 'file') {
      handleFileSelect(fileId);
    }
    return fileId;
  };

  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-background flex w-full relative overflow-hidden">
          {/* Mobile Sidebar Backdrop */}
          {isMobile && isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 animate-fade-in"
              onClick={onToggleMobileSidebar}
            />
          )}
          
          {/* Main Content Container */}
          <div className="flex-1 flex flex-col min-w-0 relative"> 
            {/* Header */}
            {isMobile ? (
              <MobileHeader
                files={convertedFiles}
                onFileSelect={handleFileSelect}
                onCreateFile={handleCreateFile}
                onToggleSidebar={onToggleMobileSidebar}
                onShowSettings={onShowSettings}
                onOpenSearch={() => setIsCommandPaletteOpen(true)}
              />
            ) : (
              <AppHeader
                activeView={activeView}
                onViewChange={handleViewChangeFromHeader}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                onToggleMobileSidebar={onToggleMobileSidebar}
                files={convertedFiles}
                onFileSelect={handleFileSelect}
                onShowSettings={onShowSettings}
              />
            )}
            
            {/* Content Area */}
            <div className={cn(
              "flex-1 min-h-0 relative",
              isMobile ? "pt-16 pb-24" : ""
            )}>
              <WorkspaceLayout
                activeView={activeView}
                onViewChange={handleViewChangeFromWorkspace}
                onNavigateToFile={handleFileSelect}
                onCreateFile={onCreateFile}
                sidebarOpen={isMobileSidebarOpen}
                onSidebarOpenChange={onToggleMobileSidebar}
                isMobile={isMobile}
              />
            </div>
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
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            favorites={favorites}
          />
          
          {/* Mobile Bottom Navigation */}
          {isMobile && (
            <MobileBottomNav
              activeView={activeView}
              onViewChange={handleViewChangeFromHeader}
              onToggleSidebar={onToggleMobileSidebar}
              onOpenSearch={() => setIsCommandPaletteOpen(true)}
              onShowSettings={onShowSettings}
            />
          )}

          {/* Floating Create Button for Mobile */}
          {isMobile && activeView === 'editor' && (
            <button
              className="fixed bottom-32 right-6 z-40 fab h-16 w-16 rounded-2xl flex items-center justify-center animate-float shadow-2xl"
              onClick={() => handleCreateFile('Nova Nota')}
              aria-label="Criar Nova Nota"
            >
              <Sparkles className="h-7 w-7 text-white" />
            </button>
          )}
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};
