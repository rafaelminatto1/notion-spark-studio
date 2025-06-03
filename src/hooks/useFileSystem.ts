
import { useState, useCallback } from 'react';
import { FileItem } from '@/types';

export const useFileSystem = () => {
  const [files, setFiles] = useState<FileItem[]>([
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
    },
    {
      id: '4',
      name: 'Álgebra Linear',
      type: 'file',
      parentId: '2',
      content: '# Álgebra Linear\n\nMatrizes e Vetores...\n\nRelacionado com [[Cálculo I]]',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['matemática', 'álgebra', 'universidade/primeiro-ano']
    },
    {
      id: '5',
      name: 'Física',
      type: 'folder',
      parentId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      emoji: '⚡'
    },
    {
      id: '6',
      name: 'Mecânica Clássica',
      type: 'file',
      parentId: '5',
      content: '# Mecânica Clássica\n\nLeis de Newton...',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['física', 'mecânica', 'universidade/segundo-ano']
    }
  ]);

  const [currentFileId, setCurrentFileId] = useState<string | null>('3');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2']));

  const createFile = useCallback((name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      type,
      parentId,
      content: type === 'file' ? '' : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setFiles(prev => [...prev, newFile]);
    
    if (type === 'file') {
      setCurrentFileId(newFile.id);
    }
    
    return newFile.id;
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<FileItem>) => {
    setFiles(prev => prev.map(file => 
      file.id === id 
        ? { ...file, ...updates, updatedAt: new Date() }
        : file
    ));
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id && file.parentId !== id));
    if (currentFileId === id) {
      setCurrentFileId(null);
    }
  }, [currentFileId]);

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

  return {
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
  };
};
