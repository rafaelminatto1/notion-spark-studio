
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { GraphView } from '@/components/GraphView';
import { Dashboard } from '@/components/Dashboard';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useQuickSwitcher } from '@/hooks/useQuickSwitcher';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  
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

  const fileTree = getFileTree();
  const currentFile = getCurrentFile();

  const handleNavigateToFile = (fileId: string) => {
    setCurrentFileId(fileId);
    navigateTo(fileId);
    setActiveView('editor');
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
    filteredCommands
  } = useQuickSwitcher(
    files,
    handleNavigateToFile,
    createFile,
    handleNavigateToGraph
  );

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
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
        
        <div className="flex-1 flex flex-col">
          {/* View Tabs */}
          <div className="p-4 border-b border-notion-dark-border">
            <div className="flex items-center justify-between">
              <ViewTabs
                activeView={activeView}
                onViewChange={setActiveView}
              />
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                
                {/* Quick Switcher Trigger */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <kbd className="px-2 py-1 bg-notion-dark-hover rounded border border-notion-dark-border">
                    Ctrl+K
                  </kbd>
                  <span>Quick Switcher</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
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
                onFileSelect={setCurrentFileId}
              />
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
