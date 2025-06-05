
import React, { useState, useEffect } from 'react';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { GlobalSearch } from '@/components/GlobalSearch';
import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { WorkspaceSettings } from '@/components/WorkspaceSettings';
import { Button } from '@/components/ui/button';
import { Menu, X, Settings } from 'lucide-react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useQuickSwitcher } from '@/hooks/useQuickSwitcher';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  
  const {
    files,
    currentFileId,
    createFile,
    updateFile,
    setCurrentFileId
  } = useFileSystem();

  const { favorites } = useFavorites();
  const { navigateTo } = useNavigation();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when view changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [activeView, isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveView('dashboard');
            break;
          case '2':
            e.preventDefault();
            setActiveView('editor');
            break;
          case '3':
            e.preventDefault();
            setActiveView('graph');
            break;
          case '4':
            e.preventDefault();
            setActiveView('templates');
            break;
          case 'p':
            e.preventDefault();
            setIsCommandPaletteOpen(true);
            break;
          case ',':
            e.preventDefault();
            setShowWorkspaceSettings(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateToFile = (fileId: string) => {
    setCurrentFileId(fileId);
    navigateTo(fileId);
    setActiveView('editor');
  };

  const handleCreateFromTemplate = (template: any) => {
    const fileId = createFile(template.name, undefined, 'file');
    updateFile(fileId, { 
      content: template.content,
      emoji: template.emoji 
    });
    handleNavigateToFile(fileId);
  };

  const handleNavigateToGraph = () => {
    setActiveView('graph');
  };

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
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Mobile Menu Button */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                      className="md:hidden"
                    >
                      {isMobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                  )}
                  
                  <ViewTabs
                    activeView={activeView}
                    onViewChange={setActiveView}
                  />
                </div>
                
                {/* Search and Controls */}
                <div className="flex items-center gap-4 min-w-0 flex-1 max-w-md">
                  <GlobalSearch
                    files={files}
                    onFileSelect={handleNavigateToFile}
                    className="flex-1"
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWorkspaceSettings(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Content Area - Now using WorkspaceLayout */}
            <WorkspaceLayout
              activeView={activeView}
              onViewChange={setActiveView}
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
