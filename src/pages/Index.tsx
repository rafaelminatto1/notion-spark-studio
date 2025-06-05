
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
  console.log('Index: Component initializing...');
  
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  
  console.log('Index: Initializing hooks...');
  
  const isMobile = useMobileDetection();
  console.log('Index: Mobile detection:', isMobile);

  const {
    files,
    currentFileId,
    createFile,
    updateFile,
    setCurrentFileId,
    isLoading
  } = useFileSystem();

  console.log('Index: FileSystem hook loaded - Files:', files?.length || 0, 'Loading:', isLoading);

  const { favorites } = useFavorites();
  console.log('Index: Favorites loaded:', favorites?.length || 0);
  
  const { navigateTo } = useNavigation();
  console.log('Index: Navigation hook loaded');

  // Initialize component ready state
  useEffect(() => {
    console.log('Index: Setting component ready...');
    setIsComponentReady(true);
  }, []);

  // Close mobile sidebar when view changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [activeView, isMobile]);

  const handleNavigateToFile = (fileId: string) => {
    console.log('Index: Navigating to file:', fileId);
    setCurrentFileId(fileId);
    navigateTo(fileId);
    setActiveView('editor');
  };

  const handleCreateFromTemplate = async (template: any) => {
    console.log('Index: Creating from template:', template);
    try {
      const fileId = await createFile(template.name, undefined, 'file');
      await updateFile(fileId, { 
        content: template.content,
        emoji: template.emoji 
      });
      handleNavigateToFile(fileId);
    } catch (error) {
      console.error('Index: Error creating from template:', error);
    }
  };

  const handleNavigateToGraph = () => {
    setActiveView('graph');
  };

  const handleViewChange = (view: string) => {
    console.log('Index: View changing to:', view);
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
    files || [],
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

  // Show loading state while component is initializing
  if (!isComponentReady || isLoading) {
    console.log('Index: Showing loading state - Component ready:', isComponentReady, 'FileSystem loading:', isLoading);
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Carregando aplicação...</p>
            <p className="text-xs text-muted-foreground">
              {!isComponentReady && 'Inicializando componentes...'}
              {isComponentReady && isLoading && 'Carregando arquivos...'}
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (showWorkspaceSettings) {
    console.log('Index: Showing workspace settings...');
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

  console.log('Index: Rendering main app with', files?.length || 0, 'files');

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
              files={files || []}
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
            commands={filteredCommands || []}
            query={quickSwitcherQuery}
            onQueryChange={setQuickSwitcherQuery}
          />

          {/* Command Palette */}
          <CommandPalette
            files={files || []}
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onFileSelect={handleNavigateToFile}
            onCreateFile={createFile}
            favorites={favorites || []}
          />
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};

export default Index;
