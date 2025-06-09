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

  // Get flat file tree for VirtualizedList
  const getFlatFileTree = useCallback(() => {
    const flatList: (FileItem & { level: number })[] = [];

    const traverse = (items: (FileItem & { children?: FileItem[] })[], level: number) => {
      items.forEach(item => {
        flatList.push({ ...item, level });
        if (item.type === 'folder' && expandedFolders.has(item.id) && item.children) {
          traverse(item.children, level + 1);
        }
      });
    };

    traverse(getFileTree(), 0);
    return flatList;
  }, [getFileTree, expandedFolders]);

  // Get current file
  const getCurrentFile = useCallback(() => {
    console.log('[useFileSystemSupabase] getCurrentFile called. currentFileId:', currentFileId, 'Files count:', files.length);
    const file = currentFileId ? files.find(f => f.id === currentFileId) : undefined;
    console.log('[useFileSystemSupabase] getCurrentFile result:', file ? file.name : 'undefined');
    return file;
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

  // Move file functionality for drag and drop
  const moveFile = useCallback(async (fileId: string, newParentId?: string, newPosition?: number) => {
    try {
      const fileToMove = files.find(f => f.id === fileId);
      if (!fileToMove) return;

      // Update the file's parent
      const updates: Partial<SupabaseFile> = {
        parent_id: newParentId || null,
        updated_at: new Date().toISOString()
      };

      // If position is specified, we might need to update other files' positions
      // For now, we'll just update the parent. Position handling can be enhanced later
      // by adding a position/order field to the database schema

      await supabaseFiles.updateFile(fileId, updates);

      // Expand the target folder if moving into it
      if (newParentId) {
        setExpandedFolders(prev => new Set([...prev, newParentId]));
      }

      console.log(`Moved file ${fileId} to parent ${newParentId || 'root'}`);
    } catch (error) {
      console.error('Error moving file:', error);
    }
  }, [files, supabaseFiles]);

  // Wrapper functions that maintain the same interface
  const createFile = useCallback(async (name: string, parentId?: string, type: 'file' | 'folder' = 'file', content?: string, emoji?: string) => {
    console.log('[useFileSystemSupabase] Attempting to create file with name:', name);
    const fileId = await supabaseFiles.createFile(name, parentId, type, content, emoji);
    console.log('[useFileSystemSupabase] File creation result - fileId:', fileId);
    if (fileId) {
      setCurrentFileId(fileId); 
      console.log('[useFileSystemSupabase] currentFileId set to:', fileId);
    }
    return fileId || '';
  }, [supabaseFiles.createFile, setCurrentFileId]);

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
    moveFile,
    loadFiles: supabaseFiles.loadFiles,
    getFlatFileTree,
  };
};
