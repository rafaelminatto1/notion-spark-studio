
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { WorkspaceLayoutPanels } from '@/components/WorkspaceLayoutPanels';
import { useWorkspaceContext } from '@/hooks/useWorkspace';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { usePanelCollapse } from '@/hooks/usePanelCollapse';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface WorkspaceLayoutProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  activeView,
  onViewChange,
  onNavigateToFile,
  onCreateFile,
  sidebarOpen = false,
  onSidebarOpenChange,
  isMobile = false
}) => {
  const { currentWorkspace, resizePanel } = useWorkspaceContext();
  const { files, currentFileId, expandedFolders, updateFile, deleteFile, toggleFolder, getFileTree, getCurrentFile, setCurrentFileId } = useFileSystem();
  const { favorites, toggleFavorite } = useFavorites();
  const { navigateTo, goBack, goForward, canGoBack, canGoForward } = useNavigation();
  
  const { toggleCollapse, isCollapsed } = usePanelCollapse({
    defaultCollapsed: {
      sidebar: false,
      properties: true
    }
  });

  const visiblePanels = currentWorkspace.panels.filter(panel => panel.isVisible);
  const leftPanels = visiblePanels.filter(p => p.position === 'left');
  const centerPanels = visiblePanels.filter(p => p.position === 'center');
  const rightPanels = visiblePanels.filter(p => p.position === 'right');

  if (visiblePanels.length === 0) {
    return (
      <div className="flex-1 p-4 md:p-8 text-center text-gray-400 bg-gradient-to-br from-background to-background/80">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-xl md:text-2xl">📋</span>
          </div>
          <h3 className="text-base md:text-lg font-medium">Nenhum painel visível</h3>
          <p className="text-xs md:text-sm text-muted-foreground">Configure os painéis nas configurações do workspace</p>
        </div>
      </div>
    );
  }

  // Mobile layout - stack panels vertically with improved spacing
  if (isMobile) {
    return (
      <div className="flex-1 min-h-0 bg-gradient-to-br from-background via-background to-background/95">
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
              onCreateFile={onCreateFile}
              onUpdateFile={updateFile}
              onDeleteFile={deleteFile}
              onNavigateToFile={onNavigateToFile}
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
            onCreateFile={onCreateFile}
            onUpdateFile={updateFile}
            onDeleteFile={deleteFile}
            onNavigateToFile={onNavigateToFile}
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
      <div className="flex h-full">
        {/* Left Panels - Direct rendering without ResizablePanelGroup for simplicity */}
        {leftPanels.map((panel) => {
          const panelIsCollapsed = panel.isCollapsible && isCollapsed(panel.id);
          
          return (
            <div 
              key={panel.id}
              className={cn(
                "transition-all duration-300 ease-in-out border-r border-border/60",
                panelIsCollapsed ? "w-0 overflow-hidden opacity-0" : "w-72 opacity-100"
              )}
            >
              <div className="h-full flex flex-col bg-background">
                {panel.title && !panelIsCollapsed && (
                  <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      {panel.type === 'sidebar' && '📁'}
                      {panel.title}
                    </h3>
                  </div>
                )}
                
                <div className="flex-1 min-h-0">
                  <WorkspaceLayoutPanels
                    panel={panel}
                    files={files}
                    currentFileId={currentFileId}
                    expandedFolders={expandedFolders}
                    favorites={favorites}
                    onFileSelect={setCurrentFileId}
                    onToggleFolder={toggleFolder}
                    onCreateFile={onCreateFile}
                    onUpdateFile={updateFile}
                    onDeleteFile={deleteFile}
                    onNavigateToFile={onNavigateToFile}
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
              </div>
            </div>
          );
        })}

        {/* Center Panels - Main content area */}
        {centerPanels.map((panel) => (
          <div key={panel.id} className="flex-1 min-w-0">
            <div className="h-full flex flex-col bg-background">
              <div className="flex-1 min-h-0">
                <WorkspaceLayoutPanels
                  panel={panel}
                  files={files}
                  currentFileId={currentFileId}
                  expandedFolders={expandedFolders}
                  favorites={favorites}
                  onFileSelect={setCurrentFileId}
                  onToggleFolder={toggleFolder}
                  onCreateFile={onCreateFile}
                  onUpdateFile={updateFile}
                  onDeleteFile={deleteFile}
                  onNavigateToFile={onNavigateToFile}
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
            </div>
          </div>
        ))}

        {/* Right Panels */}
        {rightPanels.map((panel) => {
          const panelIsCollapsed = panel.isCollapsible && isCollapsed(panel.id);
          
          return (
            <div 
              key={panel.id}
              className={cn(
                "transition-all duration-300 ease-in-out border-l border-border/60",
                panelIsCollapsed ? "w-0 overflow-hidden opacity-0" : "w-80 opacity-100"
              )}
            >
              <div className="h-full flex flex-col bg-background">
                {panel.title && !panelIsCollapsed && (
                  <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      {panel.type === 'properties' && '⚙️'}
                      {panel.title}
                    </h3>
                  </div>
                )}
                
                <div className="flex-1 min-h-0">
                  <WorkspaceLayoutPanels
                    panel={panel}
                    files={files}
                    currentFileId={currentFileId}
                    expandedFolders={expandedFolders}
                    favorites={favorites}
                    onFileSelect={setCurrentFileId}
                    onToggleFolder={toggleFolder}
                    onCreateFile={onCreateFile}
                    onUpdateFile={updateFile}
                    onDeleteFile={deleteFile}
                    onNavigateToFile={onNavigateToFile}
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
