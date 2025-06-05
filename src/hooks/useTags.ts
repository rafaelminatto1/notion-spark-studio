
import { useMemo } from 'react';
import { FileItem } from '@/types';

export interface TagWithCount {
  name: string;
  count: number;
  files: FileItem[];
  children?: TagWithCount[];
  fullPath?: string;
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

    // First, create all tag nodes
    allTags.forEach((files, tagName) => {
      const parts = tagName.split('/');
      let currentPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!tagMap.has(currentPath)) {
          // Get direct files for this exact path
          const exactFiles = allTags.get(currentPath) || [];
          
          // Get all files for this path and its children
          const allPathFiles = Array.from(allTags.entries())
            .filter(([path]) => path.startsWith(currentPath))
            .reduce((acc, [, files]) => {
              files.forEach(file => {
                if (!acc.find(f => f.id === file.id)) {
                  acc.push(file);
                }
              });
              return acc;
            }, [] as FileItem[]);

          const tag: TagWithCount = {
            name: part,
            count: allPathFiles.length,
            files: exactFiles,
            children: [],
            fullPath: currentPath
          };
          
          tagMap.set(currentPath, tag);
          
          if (parentPath) {
            const parent = tagMap.get(parentPath);
            if (parent && !parent.children!.find(child => child.name === part)) {
              parent.children!.push(tag);
            }
          } else {
            if (!tree.find(t => t.name === part)) {
              tree.push(tag);
            }
          }
        }
      }
    });

    // Sort tree and children
    const sortTags = (tags: TagWithCount[]): TagWithCount[] => {
      return tags.sort((a, b) => {
        // First by count (descending), then alphabetically
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      }).map(tag => ({
        ...tag,
        children: tag.children ? sortTags(tag.children) : undefined
      }));
    };

    return sortTags(tree);
  }, [allTags]);

  const getFilesByTag = (tagName: string): FileItem[] => {
    return allTags.get(tagName) || [];
  };

  const getFilesByTagPattern = (pattern: string): FileItem[] => {
    const matchingFiles = new Set<FileItem>();
    
    allTags.forEach((files, tagName) => {
      if (tagName.startsWith(pattern)) {
        files.forEach(file => matchingFiles.add(file));
      }
    });
    
    return Array.from(matchingFiles);
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

  const getTagStats = () => {
    const totalTags = allTags.size;
    const totalFiles = new Set(Array.from(allTags.values()).flat().map(f => f.id)).size;
    const avgTagsPerFile = files.reduce((acc, file) => acc + (file.tags?.length || 0), 0) / files.length;
    
    return {
      totalTags,
      totalFiles,
      avgTagsPerFile: Math.round(avgTagsPerFile * 100) / 100,
      hierarchicalTags: Array.from(allTags.keys()).filter(tag => tag.includes('/')).length
    };
  };

  const getSuggestedTags = (currentTags: string[] = []): string[] => {
    const suggestions = new Set<string>();
    
    // Get tags from similar files
    files.forEach(file => {
      if (file.tags) {
        const hasCommonTag = file.tags.some(tag => currentTags.includes(tag));
        if (hasCommonTag) {
          file.tags.forEach(tag => {
            if (!currentTags.includes(tag)) {
              suggestions.add(tag);
            }
          });
        }
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  };

  return {
    allTags,
    tagTree,
    getFilesByTag,
    getFilesByTagPattern,
    addTagToFile,
    removeTagFromFile,
    getTagStats,
    getSuggestedTags
  };
};
