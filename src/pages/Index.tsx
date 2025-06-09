import React from 'react';
import { IndexWorkspaceSettings } from '@/components/IndexWorkspaceSettings';
import { IndexLoadingScreen } from '@/components/IndexLoadingScreen';
import { IndexMainContent } from '@/components/IndexMainContent';
import { useIndexPage } from '@/hooks/useIndexPage';
import { useIndexKeyboardShortcuts } from '@/hooks/useIndexKeyboardShortcuts';
import { useIndexQuickSwitcher } from '@/hooks/useIndexQuickSwitcher';

const Index = () => {
  console.log('[Index] Component starting to render');

  try {
    const indexPageState = useIndexPage();
    console.log('[Index] useIndexPage completed successfully');

    const {
      // State
      activeView,
      isMobileSidebarOpen,
      isCommandPaletteOpen,
      showWorkspaceSettings,
      currentFileId,
      isMobile,
      filesLoading,
      convertedFiles,
      favorites,
      
      // State setters
      setActiveView,
      setIsMobileSidebarOpen,
      setIsCommandPaletteOpen,
      setShowWorkspaceSettings,
      setCurrentFileId,
      
      // Handlers
      handleNavigateToFile,
      handleCreateFromTemplate,
      handleViewChange,
      handleCreateFile,
      handleUpdateFile,
      navigateTo
    } = indexPageState;

    console.log('[Index] State extracted, files count:', convertedFiles.length);

    useIndexKeyboardShortcuts({
      setActiveView: handleViewChange,
      setIsCommandPaletteOpen,
      setShowWorkspaceSettings
    });
    console.log('[Index] Keyboard shortcuts initialized');

    const quickSwitcherState = useIndexQuickSwitcher({
      convertedFiles,
      setCurrentFileId,
      navigateTo,
      setActiveView: handleViewChange,
      createFile: handleCreateFile,
      currentFileId
    });
    console.log('[Index] Quick switcher initialized');

    const {
      isQuickSwitcherOpen,
      quickSwitcherQuery,
      setQuickSwitcherQuery,
      closeQuickSwitcher,
      filteredCommands
    } = quickSwitcherState;

    console.log('[Index] All hooks completed successfully');

    if (showWorkspaceSettings) {
      console.log('[Index] Rendering workspace settings');
      return (
        <IndexWorkspaceSettings
          onClose={() => setShowWorkspaceSettings(false)}
          onShowSettings={() => setShowWorkspaceSettings(true)}
        />
      );
    }

    if (filesLoading) {
      console.log('[Index] Rendering loading screen');
      return <IndexLoadingScreen />;
    }

    console.log('[Index] Rendering main content');
    return (
      <IndexMainContent
        activeView={activeView}
        isMobile={isMobile}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        convertedFiles={convertedFiles}
        favorites={favorites}
        currentFileId={currentFileId}
        setCurrentFileId={setCurrentFileId}
        navigateTo={navigateTo}
        setActiveView={setActiveView}
        onShowSettings={() => setShowWorkspaceSettings(true)}
        onCreateFile={handleCreateFile}
        isQuickSwitcherOpen={isQuickSwitcherOpen}
        closeQuickSwitcher={closeQuickSwitcher}
        filteredCommands={filteredCommands}
        quickSwitcherQuery={quickSwitcherQuery}
        setQuickSwitcherQuery={setQuickSwitcherQuery}
        isCommandPaletteOpen={isCommandPaletteOpen}
        setIsCommandPaletteOpen={setIsCommandPaletteOpen}
        onNavigateToFile={handleNavigateToFile}
      />
    );
  } catch (error) {
    console.error('[Index] Error in component:', error);
    throw error; // Re-throw to let ErrorBoundary handle it
  }
};

export default Index;
