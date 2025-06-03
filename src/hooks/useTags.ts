
import { useMemo } from 'react';
import { FileItem } from '@/types';

export interface TagWithCount {
  name: string;
  count: number;
  files: FileItem[];
  children?: TagWithCount[];
}

export const useTags = (files: FileItem[]) => {
  const allTags = useMemo(() => {
    const tagMap = new Map<string, FileItem[]>();
    
    files.forEach(file => {
      if (file.tags && file.tags.length > 0) {
        file.tags.forEach(tag => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag)!.push(file);
        });
      }
    });

    return tagMap;
  }, [files]);

  const tagTree = useMemo(() => {
    const tree: TagWithCount[] = [];
    const tagMap = new Map<string, TagWithCount>();

    // Primeiro, criar todos os nós de tag
    allTags.forEach((files, tagName) => {
      const parts = tagName.split('/');
      let currentPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!tagMap.has(currentPath)) {
          const tagFiles = allTags.get(currentPath) || [];
          const tag: TagWithCount = {
            name: part,
            count: tagFiles.length,
            files: tagFiles,
            children: []
          };
          tagMap.set(currentPath, tag);
          
          if (parentPath) {
            const parent = tagMap.get(parentPath);
            if (parent) {
              parent.children!.push(tag);
            }
          } else {
            tree.push(tag);
          }
        }
      }
    });

    return tree;
  }, [allTags]);

  const getFilesByTag = (tagName: string): FileItem[] => {
    return allTags.get(tagName) || [];
  };

  const addTagToFile = (fileId: string, tag: string, updateFile: (id: string, updates: Partial<FileItem>) => void) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const currentTags = file.tags || [];
      if (!currentTags.includes(tag)) {
        updateFile(fileId, { tags: [...currentTags, tag] });
      }
    }
  };

  const removeTagFromFile = (fileId: string, tag: string, updateFile: (id: string, updates: Partial<FileItem>) => void) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.tags) {
      const newTags = file.tags.filter(t => t !== tag);
      updateFile(fileId, { tags: newTags });
    }
  };

  return {
    allTags,
    tagTree,
    getFilesByTag,
    addTagToFile,
    removeTagFromFile
  };
};
