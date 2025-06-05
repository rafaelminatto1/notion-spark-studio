
import React, { useState, useEffect } from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { WorkspaceSettings } from '@/components/WorkspaceSettings';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useQuickSwitcher } from '@/hooks/useQuickSwitcher';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMobileDetection } from '@/hooks/useMobileDetection';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  
  const isMobile = useMobileDetection();
  
  const {
    files,
    currentFileId,
    createFile,
    updateFile,
    setCurrentFileId
  } = useFileSystem();

  const { favorites } = useFavorites();
  const { navigateTo } = useNavigation();

  // Close mobile sidebar when view changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [activeView, isMobile]);

  const handleNavigateToFile = (fileId: string) => {
    setCurrentFileId(fileId);
    navigateTo(fileId);
    setActiveView('editor');
  };

  const handleCreateFromTemplate = async (template: any) => {
    const fileId = await createFile(template.name, undefined, 'file');
    await updateFile(fileId, { 
      content: template.content,
      emoji: template.emoji 
    });
    handleNavigateToFile(fileId);
  };

  const handleNavigateToGraph = () => {
    setActiveView('graph');
  };

  const handleViewChange = (view: string) => {
    setActiveView(view as ViewMode);
  };

  useKeyboardShortcuts({
    onViewChange: setActiveView,
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenSettings: () => setShowWorkspaceSettings(true)
  });

  const {
    isOpen: isQuickSwitcherOpen,
    query: quickSwitcherQuery,
    setQuery: setQuickSwitcherQuery,
    open: openQuickSwitcher,
    close: closeQuickSwitcher,
    filteredCommands,
    addToRecent
  } = useQuickSwitcher(
    files,
    handleNavigateToFile,
    createFile,
    handleNavigateToGraph
  );

  // Add to recent when file changes
  useEffect(() => {
    if (currentFileId) {
      addToRecent(currentFileId);
    }
  }, [currentFileId, addToRecent]);

  if (showWorkspaceSettings) {
    return (
      <ThemeProvider>
        <WorkspaceProvider>
          <div className="min-h-screen bg-background">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowWorkspaceSettings(false)}
              >
                ← Voltar
              </Button>
              <h1 className="text-lg font-semibold">Configurações do Workspace</h1>
              <div />
            </div>
            <WorkspaceSettings />
          </div>
        </WorkspaceProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background text-foreground flex w-full">
          {/* Mobile Sidebar Backdrop */}
          {isMobile && isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <AppHeader
              activeView={activeView}
              onViewChange={setActiveView}
              isMobile={isMobile}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              files={files}
              onFileSelect={handleNavigateToFile}
              onShowSettings={() => setShowWorkspaceSettings(true)}
            />

            {/* Content Area */}
            <WorkspaceLayout
              activeView={activeView}
              onViewChange={handleViewChange}
              onNavigateToFile={handleNavigateToFile}
              onCreateFile={createFile}
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
            files={files}
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onFileSelect={handleNavigateToFile}
            onCreateFile={createFile}
            favorites={favorites}
          />
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};

export default Index;
