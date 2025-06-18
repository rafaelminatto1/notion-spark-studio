
import { useEffect, useCallback } from 'react';
import type { FileItem } from '@/types';

interface UseKeyboardNavigationProps {
  files: FileItem[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDeleteFile?: (fileId: string) => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  files,
  currentFileId,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  enabled = true
}: UseKeyboardNavigationProps) => {
  
  const findFileIndex = useCallback((fileId: string) => {
    return files.findIndex(f => f.id === fileId);
  }, [files]);

  const navigateToFile = useCallback((direction: 'up' | 'down') => {
    if (!currentFileId || files.length === 0) return;
    
    const currentIndex = findFileIndex(currentFileId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
    } else {
      newIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
    }
    
    onFileSelect(files[newIndex].id);
  }, [currentFileId, files, findFileIndex, onFileSelect]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        navigateToFile('up');
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        navigateToFile('down');
        break;
        
      case 'n':
        if (isCtrlOrCmd) {
          event.preventDefault();
          onCreateFile();
        }
        break;
        
      case 'f':
        if (isCtrlOrCmd && event.shiftKey) {
          event.preventDefault();
          onCreateFolder();
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        if (currentFileId && onDeleteFile && isCtrlOrCmd) {
          event.preventDefault();
          onDeleteFile(currentFileId);
        }
        break;
        
      case 'j':
        if (!isCtrlOrCmd) {
          event.preventDefault();
          navigateToFile('down');
        }
        break;
        
      case 'k':
        if (!isCtrlOrCmd) {
          event.preventDefault();
          navigateToFile('up');
        }
        break;
    }
  }, [enabled, navigateToFile, onCreateFile, onCreateFolder, currentFileId, onDeleteFile]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [handleKeyDown]);

  return {
    navigateToFile
  };
};
