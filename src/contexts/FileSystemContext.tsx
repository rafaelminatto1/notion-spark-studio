import React, { createContext, useContext, ReactNode } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { FileItem } from '@/types';
import { ViewMode } from '@/components/ViewTabs';

// Define the shape of the context value
export interface FileSystemContextType {
  // From useFileSystem
  files: FileItem[];
  loading: boolean;
  currentFileId: string | null;
  setCurrentFileId: (id: string | null) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  getFileTree: () => FileItem[];
  getCurrentFile: () => FileItem | undefined;
  createFile: (name: string, parentId?: string, type?: 'file' | 'folder', content?: string, emoji?: string) => Promise<string>;
  updateFile: (id: string, updates: Partial<FileItem>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  moveFile: (fileId: string, newParentId?: string, newPosition?: number) => Promise<void>;
  loadFiles: () => Promise<void>;
  getFlatFileTree: () => (FileItem & { level: number })[];

  // From useFavorites
  favorites: string[];
  toggleFavorite: (fileId: string) => void;

  // From useNavigation
  navigateTo: (fileId: string) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  setActiveView: (view: ViewMode) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const FileSystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const fileSystem = useFileSystem();
  const favorites = useFavorites();
  const navigation = useNavigation();

  const contextValue: FileSystemContextType = {
    ...fileSystem,
    ...favorites,
    ...navigation,
    navigateTo: (fileId: string) => {
      fileSystem.setCurrentFileId(fileId);
      navigation.navigateTo(fileId);
    },
    setActiveView: navigation.setActiveView
  };

  return (
    <FileSystemContext.Provider value={contextValue}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystemContext = () => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystemContext must be used within a FileSystemProvider');
  }
  return context;
}; 