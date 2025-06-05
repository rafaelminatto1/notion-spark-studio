
import { useCallback } from 'react';
import { useFileSystemPersistent } from './useFileSystemPersistent';
import { useOfflineSync } from './useOfflineSync';
import { useSessionManager } from './useSessionManager';
import { FileItem } from '@/types';

export const useFileSystemOffline = () => {
  const fileSystem = useFileSystemPersistent();
  const { queueOperation } = useOfflineSync();
  const { updateActivity } = useSessionManager();

  const createFileOffline = useCallback(async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    // Execute locally first
    const fileId = await fileSystem.createFile(name, parentId, type);
    
    // Update session activity
    await updateActivity({
      type: 'file_created',
      fileId
    });
    
    // Queue for sync
    const file = fileSystem.files.find(f => f.id === fileId);
    if (file) {
      await queueOperation('create', 'files', file);
    }
    
    return fileId;
  }, [fileSystem, queueOperation, updateActivity]);

  const updateFileOffline = useCallback(async (id: string, updates: Partial<FileItem>) => {
    // Execute locally first
    await fileSystem.updateFile(id, updates);
    
    // Update session activity
    await updateActivity({
      type: 'file_edited',
      fileId: id
    });
    
    // Queue for sync
    const updatedFile = fileSystem.files.find(f => f.id === id);
    if (updatedFile) {
      await queueOperation('update', 'files', updatedFile);
    }
  }, [fileSystem, queueOperation, updateActivity]);

  const deleteFileOffline = useCallback(async (id: string) => {
    // Get file data before deletion
    const fileToDelete = fileSystem.files.find(f => f.id === id);
    
    // Execute locally first
    await fileSystem.deleteFile(id);
    
    // Update session activity
    await updateActivity({
      type: 'file_edited',
      fileId: id
    });
    
    // Queue for sync
    if (fileToDelete) {
      await queueOperation('delete', 'files', { id, ...fileToDelete });
    }
  }, [fileSystem, queueOperation, updateActivity]);

  return {
    ...fileSystem,
    createFile: createFileOffline,
    updateFile: updateFileOffline,
    deleteFile: deleteFileOffline
  };
};
