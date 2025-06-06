
import React from 'react';
import { IndexWorkspaceSettings } from '@/components/IndexWorkspaceSettings';
import { IndexLoadingScreen } from '@/components/IndexLoadingScreen';
import { IndexMainContent } from '@/components/IndexMainContent';
import { useIndexPage } from '@/hooks/useIndexPage';
import { useIndexKeyboardShortcuts } from '@/hooks/useIndexKeyboardShortcuts';
import { useIndexQuickSwitcher } from '@/hooks/useIndexQuickSwitcher';

const Index = () => {
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
  } = useIndexPage();

  useIndexKeyboardShortcuts({
    setActiveView: handleViewChange,
    setIsCommandPaletteOpen,
    setShowWorkspaceSettings
  });

  const {
    isQuickSwitcherOpen,
    quickSwitcherQuery,
    setQuickSwitcherQuery,
    closeQuickSwitcher,
    filteredCommands
  } = useIndexQuickSwitcher({
    convertedFiles,
    setCurrentFileId,
    navigateTo,
    setActiveView: handleViewChange,
    createFile: handleCreateFile,
    currentFileId
  });

  if (showWorkspaceSettings) {
    return (
      <IndexWorkspaceSettings
        onClose={() => setShowWorkspaceSettings(false)}
        onShowSettings={() => setShowWorkspaceSettings(true)}
      />
    );
  }

  if (filesLoading) {
    return <IndexLoadingScreen />;
  }

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
    />
  );
};

export default Index;
