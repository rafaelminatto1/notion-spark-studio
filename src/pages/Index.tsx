import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { GraphView } from '@/components/GraphView';
import { Dashboard } from '@/components/Dashboard';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { GlobalSearch } from '@/components/GlobalSearch';
import { TemplatesManager } from '@/components/TemplatesManager';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useQuickSwitcher } from '@/hooks/useQuickSwitcher';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    files,
    currentFileId,
    expandedFolders,
    createFile,
    updateFile,
    deleteFile,
    toggleFolder,
    getFileTree,
    getCurrentFile,
    setCurrentFileId
  } = useFileSystem();

  const { favorites, toggleFavorite } = useFavorites();
  const { navigateTo, goBack, goForward, canGoBack, canGoForward } = useNavigation();

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
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fileTree = getFileTree();
  const currentFile = getCurrentFile();

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

  const handleGoBack = () => {
    const fileId = goBack();
    if (fileId) {
      setCurrentFileId(fileId);
      setActiveView('editor');
    }
  };

  const handleGoForward = () => {
    const fileId = goForward();
    if (fileId) {
      setCurrentFileId(fileId);
      setActiveView('editor');
    }
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

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        {/* Mobile Sidebar Backdrop */}
        {isMobile && isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out",
          isMobile && !isMobileSidebarOpen && "-translate-x-full"
        )}>
          <Sidebar
            files={fileTree}
            currentFileId={currentFileId}
            expandedFolders={expandedFolders}
            onFileSelect={setCurrentFileId}
            onToggleFolder={toggleFolder}
            onCreateFile={createFile}
            onUpdateFile={updateFile}
            onDeleteFile={deleteFile}
            allFiles={files}
          />
        </div>
        
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
                
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0">
            {activeView === 'dashboard' && (
              <Dashboard
                files={files}
                favorites={favorites}
                onNavigateToFile={handleNavigateToFile}
                onCreateFile={createFile}
              />
            )}
            
            {activeView === 'editor' && (
              <Editor
                file={currentFile}
                files={files}
                favorites={favorites}
                onUpdateFile={updateFile}
                onNavigateToFile={handleNavigateToFile}
                onCreateFile={createFile}
                onToggleFavorite={toggleFavorite}
                onGoBack={handleGoBack}
                onGoForward={handleGoForward}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
              />
            )}
            
            {activeView === 'graph' && (
              <GraphView
                files={files}
                currentFileId={currentFileId}
                onFileSelect={handleNavigateToFile}
              />
            )}

            {activeView === 'templates' && (
              <div className="p-6">
                <TemplatesManager
                  onCreateFromTemplate={handleCreateFromTemplate}
                />
              </div>
            )}
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
      </div>
    </ThemeProvider>
  );
};

export default Index;
