import { useState, useCallback, useEffect } from 'react';
import { FileItem } from '@/types';
import { useIndexedDB } from './useIndexedDB';
import { useActivityHistory } from './useActivityHistory';
import { useFavoritesAdvanced } from './useFavoritesAdvanced';

export const useFileSystemPersistent = () => {
  console.log('useFileSystemPersistent initializing...');
  
  const { isReady, get, getAll, set, remove, query } = useIndexedDB();
  const { logFileCreate, logFileUpdate, logFileDelete, logFileRename } = useActivityHistory();
  const { addToFavorites } = useFavoritesAdvanced();
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  console.log('IndexedDB ready:', isReady, 'Files count:', files.length);

  // Load files from IndexedDB on startup
  useEffect(() => {
    const loadFiles = async () => {
      console.log('Loading files from IndexedDB...');
      
      if (!isReady) {
        console.log('IndexedDB not ready yet...');
        return;
      }
      
      try {
        const savedFiles = await getAll<FileItem>('files');
        console.log('Loaded files from IndexedDB:', savedFiles.length);
        
        const savedWorkspace = await get<any>('workspace', 'current');
        console.log('Loaded workspace:', savedWorkspace);
        
        if (savedFiles.length > 0) {
          setFiles(savedFiles);
          if (savedWorkspace?.currentFileId) {
            setCurrentFileId(savedWorkspace.currentFileId);
          }
          if (savedWorkspace?.expandedFolders) {
            setExpandedFolders(new Set(savedWorkspace.expandedFolders));
          }
        } else {
          console.log('No saved files, creating default files...');
          // Initialize with default files
          const defaultFiles: FileItem[] = [
            {
              id: '1',
              name: 'Meus Estudos',
              type: 'folder',
              createdAt: new Date(),
              updatedAt: new Date(),
              emoji: '📚'
            },
            {
              id: '2',
              name: 'Matemática',
              type: 'folder',
              parentId: '1',
              createdAt: new Date(),
              updatedAt: new Date(),
              emoji: '🔢'
            },
            {
              id: '3',
              name: 'Cálculo I',
              type: 'file',
              parentId: '2',
              content: '# Cálculo I\n\nLimites e Derivadas...\n\nVer também: [[Álgebra Linear]]',
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: ['matemática', 'cálculo', 'universidade/primeiro-ano']
            }
          ];
          
          // Save default files to IndexedDB
          for (const file of defaultFiles) {
            await set('files', file);
          }
          
          setFiles(defaultFiles);
          setCurrentFileId('3');
          setExpandedFolders(new Set(['1', '2']));
          
          console.log('Default files created and saved');
        }
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoading(false);
        console.log('File loading complete');
      }
    };

    loadFiles();
  }, [isReady, getAll, get, set]);

  // Save workspace state whenever it changes
  useEffect(() => {
    if (!isReady || isLoading) return;
    
    const saveWorkspace = async () => {
      try {
        await set('workspace', {
          id: 'current',
          currentFileId,
          expandedFolders: Array.from(expandedFolders),
          lastSaved: new Date()
        });
        console.log('Workspace state saved');
      } catch (error) {
        console.error('Error saving workspace:', error);
      }
    };

    saveWorkspace();
  }, [currentFileId, expandedFolders, isReady, isLoading, set]);

  const createFile = useCallback(async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    console.log('Creating file:', name, type, parentId);
    
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      type,
      parentId,
      content: type === 'file' ? '' : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      await set('files', newFile);
      setFiles(prev => [...prev, newFile]);
      
      // Log da atividade
      logFileCreate(newFile);
      
      if (type === 'file') {
        setCurrentFileId(newFile.id);
      }
      
      console.log('File created successfully:', newFile.id);
      return newFile.id;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }, [set, logFileCreate]);

  const updateFile = useCallback(async (id: string, updates: Partial<FileItem>) => {
    try {
      const existingFile = files.find(f => f.id === id);
      if (!existingFile) return;

      const updatedFile = { 
        ...existingFile, 
        ...updates, 
        updatedAt: new Date() 
      };
      
      await set('files', updatedFile);
      setFiles(prev => prev.map(file => 
        file.id === id ? updatedFile : file
      ));

      // Log da atividade apenas se for uma mudança significativa
      if (updates.content !== undefined || updates.name !== undefined) {
        if (updates.name && updates.name !== existingFile.name) {
          logFileRename(existingFile.name, updates.name, id);
        } else {
          logFileUpdate(updatedFile);
        }
      }
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }, [files, set, logFileUpdate, logFileRename]);

  const deleteFile = useCallback(async (id: string) => {
    try {
      const fileToDelete = files.find(f => f.id === id);
      if (!fileToDelete) return;

      // Find all child files/folders to delete
      const toDelete = [id];
      const findChildren = (parentId: string) => {
        files.forEach(file => {
          if (file.parentId === parentId) {
            toDelete.push(file.id);
            if (file.type === 'folder') {
              findChildren(file.id);
            }
          }
        });
      };
      findChildren(id);

      // Delete from IndexedDB
      for (const fileId of toDelete) {
        await remove('files', fileId);
      }

      // Log da atividade
      logFileDelete(fileToDelete.name, id);

      // Update local state
      setFiles(prev => prev.filter(file => !toDelete.includes(file.id)));
      
      if (currentFileId && toDelete.includes(currentFileId)) {
        setCurrentFileId(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }, [files, currentFileId, remove, logFileDelete]);

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

  const getFileTree = useCallback(() => {
    const tree: (FileItem & { children?: FileItem[] })[] = [];
    const fileMap = new Map<string, FileItem & { children?: FileItem[] }>();

    // Create map with children arrays
    files.forEach(file => {
      fileMap.set(file.id, { ...file, children: [] });
    });

    // Build tree structure
    files.forEach(file => {
      const fileWithChildren = fileMap.get(file.id)!;
      if (file.parentId) {
        const parent = fileMap.get(file.parentId);
        if (parent) {
          parent.children!.push(fileWithChildren);
        }
      } else {
        tree.push(fileWithChildren);
      }
    });

    return tree;
  }, [files]);

  const getCurrentFile = useCallback(() => {
    return files.find(file => file.id === currentFileId);
  }, [files, currentFileId]);

  const searchFiles = useCallback(async (searchTerm: string) => {
    if (!isReady || !searchTerm.trim()) return [];
    
    try {
      const allFiles = await query<FileItem>('files', 'type', 'file');
      return allFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }, [isReady, query]);

  const addToFavoritesList = useCallback(async (fileId: string, category?: string, notes?: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      await addToFavorites(file, category, notes);
    }
  }, [files, addToFavorites]);

  return {
    files,
    currentFileId,
    expandedFolders,
    isLoading,
    createFile,
    updateFile,
    deleteFile,
    toggleFolder,
    getFileTree,
    getCurrentFile,
    setCurrentFileId,
    searchFiles,
    addToFavoritesList
  };
};
