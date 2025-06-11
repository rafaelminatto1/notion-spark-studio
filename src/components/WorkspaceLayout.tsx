import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { WorkspaceLayoutPanels } from '@/components/WorkspaceLayoutPanels';
import { useWorkspaceContext } from '@/hooks/useWorkspace';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { usePanelCollapse } from '@/hooks/usePanelCollapse';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import './workspace-layout-improvements.css';

// Import components for different views
import { Dashboard } from '@/components/Dashboard';
import { Editor } from '@/components/Editor';
import { TemplatesManager } from '@/components/TemplatesManager';
import { GraphContainer } from '@/components/GraphView/GraphContainer';
import { EvernoteLayout } from '@/components/EvernoteLayout';
import { ViewMode } from '@/components/ViewTabs'; // Import ViewMode type
import { Sidebar } from '@/components/Sidebar'; // Import Sidebar

interface WorkspaceLayoutProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
  onNavigateToFile: (fileId: string) => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  activeView,
  onViewChange,
  sidebarOpen = false,
  onSidebarOpenChange,
  isMobile = false,
  onNavigateToFile,
}) => {
  const { currentWorkspace } = useWorkspaceContext();
  const { isCollapsed } = usePanelCollapse({
    defaultCollapsed: {
      sidebar: false,
      properties: true
    }
  });

  // Use context for file system operations, favorites, and navigation
  const {
    files,
    currentFileId,
    expandedFolders,
    setCurrentFileId,
    toggleFolder,
    getFileTree,
    getCurrentFile,
    createFile,
    updateFile,
    deleteFile,
    moveFile,
    favorites,
    toggleFavorite,
    navigateTo,
    goBack,
    goForward,
    canGoBack,
    canGoForward
  } = useFileSystemContext();

  const visiblePanels = currentWorkspace.panels.filter(panel => panel.isVisible);
  const leftPanels = visiblePanels.filter(p => p.position === 'left');
  const centerPanels = visiblePanels.filter(p => p.position === 'center');
  const rightPanels = visiblePanels.filter(p => p.position === 'right');

  const renderContent = () => {
    console.log('[WorkspaceLayout] renderContent called. activeView:', activeView, 'currentFileId:', currentFileId);
    switch (activeView) {
      case 'evernote':
        console.log('[WorkspaceLayout] Rendering EvernoteLayout');
        return (
          <EvernoteLayout
            isMobile={isMobile}
          />
        );
      case 'dashboard':
        console.log('[WorkspaceLayout] Rendering Dashboard');
        return (
          <Dashboard
            files={files}
            favorites={favorites}
            onNavigateToFile={navigateTo}
            onCreateFile={(name: string) => createFile(name, undefined, 'file')}
          />
        );
      case 'editor': {
        const currentFile = getCurrentFile();
        console.log('[WorkspaceLayout] Rendering Editor. currentFile:', currentFile ? currentFile.name : 'undefined');
        if (!currentFile) {
          console.log('[WorkspaceLayout] No file selected for Editor.');
          return (
            <div className="flex-1 p-4 md:p-8 text-center text-gray-400 bg-gradient-to-br from-background to-background/80">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xl md:text-2xl">📝</span>
                </div>
                <h3 className="text-base md:text-lg font-medium">Nenhum arquivo selecionado</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Crie ou selecione um arquivo para começar a editar.</p>
              </div>
            </div>
          );
        }
        return (
          <Editor
            file={currentFile}
            files={files}
            favorites={favorites}
            onUpdateFile={updateFile}
            onNavigateToFile={navigateTo}
            onCreateFile={(name: string) => createFile(name, undefined, 'file')}
            onToggleFavorite={toggleFavorite}
            onGoBack={goBack}
            onGoForward={goForward}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
          />
        );
      }
      case 'templates':
        return (
          <TemplatesManager
            onCreateFromTemplate={async (template) => {
              const newFileId = await createFile(template.name, undefined, 'file');
              if (newFileId) {
                await updateFile(newFileId, { content: template.content, tags: [template.category] });
                navigateTo(newFileId);
              }
            }}
          />
        );
      case 'graph':
        return (
          <GraphContainer
            files={files}
            currentFileId={currentFileId}
            onFileSelect={navigateTo}
          />
        );
      default:
    return (
      <div className="flex-1 p-4 md:p-8 text-center text-gray-400 bg-gradient-to-br from-background to-background/80">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-xl md:text-2xl">📋</span>
          </div>
              <h3 className="text-base md:text-lg font-medium">Nenhuma visualização selecionada</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Selecione uma visualização no cabeçalho.</p>
        </div>
      </div>
    );
  }
  };

  // Mobile layout - stack panels vertically with improved spacing
  if (isMobile) {
    return (
      <div className="flex-1 min-h-0 bg-gradient-to-br from-background via-background to-background/95 pt-4 pb-4 px-2
                      iphone-11:pt-6 iphone-11:pb-6 iphone-11:px-4
                      ipad-10:pt-8 ipad-10:pb-8 ipad-10:px-6">
        {/* Mobile - show only center panel (editor) when sidebar is closed */}
        {!sidebarOpen && centerPanels.map(panel => (
          <div key={panel.id} className="h-full">
            <WorkspaceLayoutPanels
              panel={panel}
              files={files}
              currentFileId={currentFileId}
              expandedFolders={expandedFolders}
              favorites={favorites}
              onFileSelect={setCurrentFileId}
              onToggleFolder={toggleFolder}
              onCreateFile={createFile}
              onUpdateFile={updateFile}
              onDeleteFile={deleteFile}
              onNavigateToFile={navigateTo}
              onToggleFavorite={toggleFavorite}
              onGoBack={goBack}
              onGoForward={goForward}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              getFileTree={getFileTree}
              getCurrentFile={getCurrentFile}
              setCurrentFileId={setCurrentFileId}
              isMobile={isMobile}
              sidebarOpen={sidebarOpen}
              onSidebarOpenChange={onSidebarOpenChange}
            />
          </div>
        ))}
        
        {/* Mobile sidebar handled by WorkspaceLayoutPanels */}
        {leftPanels.map(panel => (
          <WorkspaceLayoutPanels
            key={panel.id}
            panel={panel}
            files={files}
            currentFileId={currentFileId}
            expandedFolders={expandedFolders}
            favorites={favorites}
            onFileSelect={setCurrentFileId}
            onToggleFolder={toggleFolder}
            onCreateFile={createFile}
            onUpdateFile={updateFile}
            onDeleteFile={deleteFile}
            onNavigateToFile={navigateTo}
            onToggleFavorite={toggleFavorite}
            onGoBack={goBack}
            onGoForward={goForward}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            getFileTree={getFileTree}
            getCurrentFile={getCurrentFile}
            setCurrentFileId={setCurrentFileId}
            isMobile={isMobile}
            sidebarOpen={sidebarOpen}
            onSidebarOpenChange={onSidebarOpenChange}
          />
        ))}
      </div>
    );
  }

  // Desktop layout - simplified without unnecessary handles
  return (
    <div className="flex-1 min-h-0 bg-gradient-to-br from-background via-background to-background/95">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={40}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => onSidebarOpenChange?.(false)}
          onExpand={() => onSidebarOpenChange?.(true)}
              className={cn(
            "transition-all duration-300 ease-in-out",
            !sidebarOpen && isMobile ? "w-0 overflow-hidden" : ""
              )}
            >
              <div className="h-full flex flex-col bg-background sidebar-attached">
            <Sidebar
                    isMobile={isMobile}
              open={sidebarOpen}
              onOpenChange={onSidebarOpenChange}
              onNavigateToFile={onNavigateToFile}
                  />
                </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-transparent w-1 hover:bg-purple-500/30 transition-colors" />

        <ResizablePanel defaultSize={75}>
            <div className="h-full flex flex-col bg-background workspace-layout-no-gap">
              <div className="flex-1 min-h-0">
              {renderContent()}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
