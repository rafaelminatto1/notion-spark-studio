
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { useFileSystem } from '@/hooks/useFileSystem';

const Index = () => {
  const {
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
      />
      
      <Editor
        file={currentFile}
        onUpdateFile={updateFile}
      />
    </div>
  );
};

export default Index;
