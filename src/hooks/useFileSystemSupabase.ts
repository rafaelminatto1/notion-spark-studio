
import { useState, useCallback, useMemo } from 'react';
import { useSupabaseFiles, SupabaseFile } from './useSupabaseFiles';
import { FileItem } from '@/types';

export const useFileSystemSupabase = () => {
  const supabaseFiles = useSupabaseFiles();
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Convert SupabaseFile to FileItem
  const convertSupabaseFileToFileItem = useCallback((file: SupabaseFile): FileItem => {
    return {
      id: file.id,
      name: file.name,
      type: file.type as 'file' | 'folder',
      parentId: file.parent_id || undefined,
      content: file.content || undefined,
      emoji: file.emoji || undefined,
      description: file.description || undefined,
      tags: file.tags || [],
      isPublic: file.is_public,
      isProtected: file.is_protected,
      showInSidebar: file.show_in_sidebar,
      createdAt: new Date(file.created_at),
      updatedAt: new Date(file.updated_at),
      comments: []
    };
  }, []);

  // Convert all files
  const files = useMemo(() => 
    supabaseFiles.files.map(convertSupabaseFileToFileItem),
    [supabaseFiles.files, convertSupabaseFileToFileItem]
  );

  // Get file tree structure
  const getFileTree = useCallback(() => {
    const buildTree = (parentId?: string): any[] => {
      return files
        .filter(file => file.parentId === parentId)
        .map(file => ({
          ...file,
          children: file.type === 'folder' ? buildTree(file.id) : []
        }));
    };
    return buildTree();
  }, [files]);

  // Get current file
  const getCurrentFile = useCallback(() => {
    return currentFileId ? files.find(f => f.id === currentFileId) : undefined;
  }, [currentFileId, files]);

  // Toggle folder expanded state
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // Wrapper functions that maintain the same interface
  const createFile = useCallback(async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    const fileId = await supabaseFiles.createFile(name, parentId, type);
    return fileId || '';
  }, [supabaseFiles.createFile]);

  const updateFile = useCallback(async (id: string, updates: Partial<FileItem>) => {
    // Convert FileItem updates to SupabaseFile updates
    const supabaseUpdates: Partial<SupabaseFile> = {
      name: updates.name,
      content: updates.content,
      emoji: updates.emoji,
      description: updates.description,
      tags: updates.tags,
      is_public: updates.isPublic,
      is_protected: updates.isProtected,
      show_in_sidebar: updates.showInSidebar
    };
    
    await supabaseFiles.updateFile(id, supabaseUpdates);
  }, [supabaseFiles.updateFile]);

  const deleteFile = useCallback(async (id: string) => {
    await supabaseFiles.deleteFile(id);
    // Clear current file if it was deleted
    if (currentFileId === id) {
      setCurrentFileId(null);
    }
  }, [supabaseFiles.deleteFile, currentFileId]);

  return {
    files,
    loading: supabaseFiles.loading,
    currentFileId,
    setCurrentFileId,
    expandedFolders,
    toggleFolder,
    getFileTree,
    getCurrentFile,
    createFile,
    updateFile,
    deleteFile,
    loadFiles: supabaseFiles.loadFiles
  };
};
