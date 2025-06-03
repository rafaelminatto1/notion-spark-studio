
import { useMemo } from 'react';
import { FileItem } from '@/types';
import { parseLinks, findBacklinks } from '@/utils/linkParser';

export const useLinks = (files: FileItem[], currentFile?: FileItem) => {
  const getFileByName = (fileName: string): FileItem | undefined => {
    return files.find(file => 
      file.type === 'file' && file.name.toLowerCase() === fileName.toLowerCase()
    );
  };

  const currentFileLinks = useMemo(() => {
    if (!currentFile?.content) return [];
    return parseLinks(currentFile.content);
  }, [currentFile?.content]);

  const backlinks = useMemo(() => {
    if (!currentFile) return [];
    return findBacklinks(files, currentFile.name);
  }, [files, currentFile?.name]);

  const navigateToFile = (fileName: string): string | null => {
    const targetFile = getFileByName(fileName);
    return targetFile?.id || null;
  };

  return {
    currentFileLinks,
    backlinks,
    getFileByName,
    navigateToFile
  };
};
