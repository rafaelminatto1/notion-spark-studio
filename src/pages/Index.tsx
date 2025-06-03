import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { GraphView } from '@/components/GraphView';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { useFileSystem } from '@/hooks/useFileSystem';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>('editor');
  
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

  const fileTree = getFileTree();
  const currentFile = getCurrentFile();

  const handleNavigateToFile = (fileId: string) => {
    setCurrentFileId(fileId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
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
          <ViewTabs
            activeView={activeView}
            onViewChange={setActiveView}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeView === 'editor' ? (
            <Editor
              file={currentFile}
              files={files}
              onUpdateFile={updateFile}
              onNavigateToFile={handleNavigateToFile}
              onCreateFile={createFile}
            />
          ) : (
            <GraphView
              files={files}
              currentFileId={currentFileId}
              onFileSelect={setCurrentFileId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
