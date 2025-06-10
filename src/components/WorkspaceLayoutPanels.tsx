import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { GraphContainer } from '@/components/GraphView/GraphContainer';
import { Dashboard } from '@/components/Dashboard';
import { TemplatesManager } from '@/components/TemplatesManager';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { DailyNotesPanel } from '@/components/DailyNotesPanel';
import { PanelConfig } from '@/types/workspace';
import { FileItem } from '@/types';

interface WorkspaceLayoutPanelsProps {
  panel: PanelConfig;
  files: FileItem[];
  currentFileId: string | null;
  expandedFolders: Set<string>;
  favorites: string[];
  onFileSelect: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onDeleteFile: (id: string) => void;
  onNavigateToFile: (fileId: string) => void;
  onToggleFavorite: (fileId: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  getFileTree: () => any[];
  getCurrentFile: () => FileItem | undefined;
  setCurrentFileId: (id: string | null) => void;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
}

export const WorkspaceLayoutPanels: React.FC<WorkspaceLayoutPanelsProps> = ({
  panel,
  files,
  currentFileId,
  expandedFolders,
  favorites,
  onFileSelect,
  onToggleFolder,
  onCreateFile,
  onUpdateFile,
  onDeleteFile,
  onNavigateToFile,
  onToggleFavorite,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
  getFileTree,
  getCurrentFile,
  setCurrentFileId,
  isMobile = false,
  sidebarOpen = false,
  onSidebarOpenChange
}) => {
  switch (panel.type) {
    case 'sidebar':
      return (
        <Sidebar
          files={getFileTree()}
          currentFileId={currentFileId}
          expandedFolders={expandedFolders}
          onFileSelect={setCurrentFileId}
          onToggleFolder={onToggleFolder}
          onCreateFile={onCreateFile}
          onUpdateFile={onUpdateFile}
          onDeleteFile={onDeleteFile}
          allFiles={files}
          isMobile={isMobile}
          open={sidebarOpen}
          onOpenChange={onSidebarOpenChange}
        />
      );
    
    case 'editor':
      return (
        <Editor
          file={getCurrentFile()}
          files={files}
          favorites={favorites}
          onUpdateFile={onUpdateFile}
          onNavigateToFile={onNavigateToFile}
          onCreateFile={onCreateFile}
          onToggleFavorite={onToggleFavorite}
          onGoBack={onGoBack}
          onGoForward={onGoForward}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      );
    
    case 'graph':
      return (
        <GraphContainer
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
          onCreateFromTemplate={async (template) => {
            const fileId = await onCreateFile(template.name);
            onUpdateFile(fileId, { 
              content: template.content,
              emoji: template.emoji 
            });
            onNavigateToFile(fileId);
          }}
        />
      );
    
    case 'custom':
      if (panel.id === 'properties') {
        return <PropertiesPanel file={getCurrentFile()} onUpdateFile={onUpdateFile} />;
      }
      if (panel.id === 'daily-notes') {
        return (
          <DailyNotesPanel
            files={files}
            onCreateFile={onCreateFile}
            onUpdateFile={onUpdateFile}
            onNavigateToFile={onNavigateToFile}
          />
        );
      }
      return <div className="p-4 text-gray-400">Painel customizado: {panel.title}</div>;
    
    default:
      return <div className="p-4 text-gray-400">Painel desconhecido</div>;
  }
};
