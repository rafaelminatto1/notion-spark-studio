
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { WorkspaceLayoutPanels } from '@/components/WorkspaceLayoutPanels';
import { useWorkspaceContext } from '@/hooks/useWorkspace';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
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

  const visiblePanels = currentWorkspace.panels.filter(panel => panel.isVisible);
  const leftPanels = visiblePanels.filter(p => p.position === 'left');
  const centerPanels = visiblePanels.filter(p => p.position === 'center');
  const rightPanels = visiblePanels.filter(p => p.position === 'right');

  if (visiblePanels.length === 0) {
    return <div className="flex-1 p-8 text-center text-gray-400">Nenhum painel visível</div>;
  }

  const renderPanel = (panel: any, index: number, panels: any[]) => (
    <React.Fragment key={panel.id}>
      <ResizablePanel
        defaultSize={panel.size}
        minSize={panel.minSize || 10}
        maxSize={panel.maxSize || 50}
        onResize={(size) => resizePanel(panel.id, size)}
        className={cn("min-w-0", !panel.isCollapsible && "overflow-hidden")}
      >
        <div className="h-full flex flex-col bg-notion-dark border-r border-notion-dark-border">
          {panel.title && (
            <div className="px-4 py-2 border-b border-notion-dark-border">
              <h3 className="text-sm font-medium text-white">{panel.title}</h3>
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
            />
          </div>
        </div>
      </ResizablePanel>
      {index < panels.length - 1 && <ResizableHandle withHandle />}
    </React.Fragment>
  );

  return (
    <div className="flex-1 min-h-0">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panels */}
        {leftPanels.map((panel, index) => renderPanel(panel, index, leftPanels))}

        {/* Handle between left and center */}
        {leftPanels.length > 0 && centerPanels.length > 0 && <ResizableHandle withHandle />}

        {/* Center Panels */}
        {centerPanels.map((panel, index) => renderPanel(panel, index, centerPanels))}

        {/* Handle between center and right */}
        {centerPanels.length > 0 && rightPanels.length > 0 && <ResizableHandle withHandle />}

        {/* Right Panels */}
        {rightPanels.map((panel, index) => renderPanel(panel, index, rightPanels))}
      </ResizablePanelGroup>
    </div>
  );
};
