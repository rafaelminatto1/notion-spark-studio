
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { useFileSystem } from '@/hooks/useFileSystem';

const Index = () => {
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
        allFiles={files} // Passando todos os arquivos para acessar tags
      />
      
      <Editor
        file={currentFile}
        files={files}
        onUpdateFile={updateFile}
        onNavigateToFile={handleNavigateToFile}
        onCreateFile={createFile}
      />
    </div>
  );
};

export default Index;
