
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { GraphView } from '@/components/GraphView';
import { Dashboard } from '@/components/Dashboard';
import { TemplatesManager } from '@/components/TemplatesManager';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { useWorkspaceContext } from '@/hooks/useWorkspace';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { PanelConfig } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface WorkspaceLayoutProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => string;
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

  const renderPanelContent = (panel: PanelConfig) => {
    switch (panel.type) {
      case 'sidebar':
        return (
          <Sidebar
            files={getFileTree()}
            currentFileId={currentFileId}
            expandedFolders={expandedFolders}
            onFileSelect={setCurrentFileId}
            onToggleFolder={toggleFolder}
            onCreateFile={onCreateFile}
            onUpdateFile={updateFile}
            onDeleteFile={deleteFile}
            allFiles={files}
          />
        );
      
      case 'editor':
        return (
          <Editor
            file={getCurrentFile()}
            files={files}
            favorites={favorites}
            onUpdateFile={updateFile}
            onNavigateToFile={onNavigateToFile}
            onCreateFile={onCreateFile}
            onToggleFavorite={toggleFavorite}
            onGoBack={() => {
              const fileId = goBack();
              if (fileId) {
                setCurrentFileId(fileId);
              }
            }}
            onGoForward={() => {
              const fileId = goForward();
              if (fileId) {
                setCurrentFileId(fileId);
              }
            }}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
          />
        );
      
      case 'graph':
        return (
          <GraphView
            files={files}
            currentFileId={currentFileId}
            onFileSelect={onNavigateToFile}
          />
        );
      
      case 'dashboard':
        return (
          <Dashboard
            files={files}
            favorites={favorites}
            onNavigateToFile={onNavigateToFile}
            onCreateFile={onCreateFile}
          />
        );
      
      case 'templates':
        return (
          <TemplatesManager
            onCreateFromTemplate={(template) => {
              const fileId = onCreateFile(template.name);
              updateFile(fileId, { 
                content: template.content,
                emoji: template.emoji 
              });
              onNavigateToFile(fileId);
            }}
          />
        );
      
      case 'custom':
        if (panel.id === 'properties') {
          return <PropertiesPanel file={getCurrentFile()} onUpdateFile={updateFile} />;
        }
        return <div className="p-4 text-gray-400">Painel customizado: {panel.title}</div>;
      
      default:
        return <div className="p-4 text-gray-400">Painel desconhecido</div>;
    }
  };

  if (visiblePanels.length === 0) {
    return <div className="flex-1 p-8 text-center text-gray-400">Nenhum painel visível</div>;
  }

  return (
    <div className="flex-1 min-h-0">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panels */}
        {leftPanels.map((panel, index) => (
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
                  {renderPanelContent(panel)}
                </div>
              </div>
            </ResizablePanel>
            {index < leftPanels.length - 1 && <ResizableHandle withHandle />}
          </React.Fragment>
        ))}

        {/* Handle between left and center */}
        {leftPanels.length > 0 && centerPanels.length > 0 && <ResizableHandle withHandle />}

        {/* Center Panels */}
        {centerPanels.map((panel, index) => (
          <React.Fragment key={panel.id}>
            <ResizablePanel
              defaultSize={panel.size}
              minSize={panel.minSize || 20}
              className="min-w-0"
            >
              <div className="h-full flex flex-col bg-background">
                {panel.title && (
                  <div className="px-4 py-2 border-b border-border">
                    <h3 className="text-sm font-medium">{panel.title}</h3>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  {renderPanelContent(panel)}
                </div>
              </div>
            </ResizablePanel>
            {index < centerPanels.length - 1 && <ResizableHandle withHandle />}
          </React.Fragment>
        ))}

        {/* Handle between center and right */}
        {centerPanels.length > 0 && rightPanels.length > 0 && <ResizableHandle withHandle />}

        {/* Right Panels */}
        {rightPanels.map((panel, index) => (
          <React.Fragment key={panel.id}>
            <ResizablePanel
              defaultSize={panel.size}
              minSize={panel.minSize || 10}
              maxSize={panel.maxSize || 50}
              onResize={(size) => resizePanel(panel.id, size)}
              className="min-w-0"
            >
              <div className="h-full flex flex-col bg-notion-dark border-l border-notion-dark-border">
                {panel.title && (
                  <div className="px-4 py-2 border-b border-notion-dark-border">
                    <h3 className="text-sm font-medium text-white">{panel.title}</h3>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  {renderPanelContent(panel)}
                </div>
              </div>
            </ResizablePanel>
            {index < rightPanels.length - 1 && <ResizableHandle withHandle />}
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    </div>
  );
};
