
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { WorkspaceLayoutPanels } from '@/components/WorkspaceLayoutPanels';
import { useWorkspaceContext } from '@/hooks/useWorkspace';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { usePanelCollapse } from '@/hooks/usePanelCollapse';
import { cn } from '@/lib/utils';

interface WorkspaceLayoutProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  activeView,
  onViewChange,
  onNavigateToFile,
  onCreateFile
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
      <div className="flex-1 p-8 text-center text-gray-400 bg-gradient-to-br from-background to-background/80">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-medium">Nenhum painel visível</h3>
          <p className="text-sm text-muted-foreground">Configure os painéis nas configurações do workspace</p>
        </div>
      </div>
    );
  }

  const renderPanel = (panel: any, index: number, panels: any[], position: 'left' | 'right' | 'center') => {
    const panelIsCollapsed = panel.isCollapsible && isCollapsed(panel.id);
    const effectiveSize = panelIsCollapsed ? 0 : panel.size;
    
    return (
      <React.Fragment key={panel.id}>
        <ResizablePanel
          defaultSize={effectiveSize}
          minSize={panelIsCollapsed ? 0 : (panel.minSize || 10)}
          maxSize={panelIsCollapsed ? 0 : (panel.maxSize || 50)}
          onResize={(size) => !panelIsCollapsed && resizePanel(panel.id, size)}
          className={cn(
            "min-w-0 transition-all duration-300 ease-in-out",
            panelIsCollapsed && "overflow-hidden",
            position === 'center' && "flex-1"
          )}
          collapsible={panel.isCollapsible}
          collapsedSize={0}
        >
          <div className={cn(
            "h-full flex flex-col bg-background border-r border-border/60 transition-all duration-300",
            panelIsCollapsed ? "w-0 opacity-0" : "opacity-100",
            position === 'left' && "shadow-lg shadow-black/5",
            position === 'right' && "shadow-lg shadow-black/5 border-l border-r-0"
          )}>
            {panel.title && !panelIsCollapsed && (
              <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  {panel.type === 'sidebar' && '📁'}
                  {panel.type === 'editor' && '✏️'}
                  {panel.type === 'properties' && '⚙️'}
                  {panel.title}
                </h3>
              </div>
            )}
            
            <div className={cn(
              "flex-1 min-h-0 transition-all duration-300",
              panelIsCollapsed ? "scale-95 opacity-0" : "scale-100 opacity-100"
            )}>
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
              />
            </div>
          </div>
        </ResizablePanel>
        
        {index < panels.length - 1 && (
          <ResizableHandle 
            withHandle 
            withCollapseButton={panel.isCollapsible}
            onCollapse={() => toggleCollapse(panel.id)}
            isCollapsed={panelIsCollapsed}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex-1 min-h-0 bg-gradient-to-br from-background via-background to-background/95">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panels */}
        {leftPanels.map((panel, index) => renderPanel(panel, index, leftPanels, 'left'))}

        {/* Handle between left and center */}
        {leftPanels.length > 0 && centerPanels.length > 0 && (
          <ResizableHandle 
            withHandle 
            withCollapseButton={leftPanels.some(p => p.isCollapsible)}
            onCollapse={() => leftPanels.forEach(p => p.isCollapsible && toggleCollapse(p.id))}
            isCollapsed={leftPanels.some(p => isCollapsed(p.id))}
          />
        )}

        {/* Center Panels */}
        {centerPanels.map((panel, index) => renderPanel(panel, index, centerPanels, 'center'))}

        {/* Handle between center and right */}
        {centerPanels.length > 0 && rightPanels.length > 0 && (
          <ResizableHandle 
            withHandle 
            withCollapseButton={rightPanels.some(p => p.isCollapsible)}
            onCollapse={() => rightPanels.forEach(p => p.isCollapsible && toggleCollapse(p.id))}
            isCollapsed={rightPanels.some(p => isCollapsed(p.id))}
          />
        )}

        {/* Right Panels */}
        {rightPanels.map((panel, index) => renderPanel(panel, index, rightPanels, 'right'))}
      </ResizablePanelGroup>
    </div>
  );
};
