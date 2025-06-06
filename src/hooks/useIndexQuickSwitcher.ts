
import { useEffect } from 'react';
import { useQuickSwitcher } from '@/hooks/useQuickSwitcher';
import { FileItem } from '@/types';

interface UseIndexQuickSwitcherProps {
  convertedFiles: FileItem[];
  setCurrentFileId: (id: string | null) => void;
  navigateTo: (fileId: string) => void;
  setActiveView: (view: string) => void;
  createFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  currentFileId: string | null;
}

export const useIndexQuickSwitcher = ({
  convertedFiles,
  setCurrentFileId,
  navigateTo,
  setActiveView,
  createFile,
  currentFileId
}: UseIndexQuickSwitcherProps) => {
  const handleNavigateToGraphFromQuickSwitcher = () => {
    setActiveView('graph');
  };

  const {
    isOpen: isQuickSwitcherOpen,
    query: quickSwitcherQuery,
    setQuery: setQuickSwitcherQuery,
    open: openQuickSwitcher,
    close: closeQuickSwitcher,
    filteredCommands,
    addToRecent
  } = useQuickSwitcher(
    convertedFiles,
    (fileId: string) => {
      setCurrentFileId(fileId);
      navigateTo(fileId);
      setActiveView('editor');
    },
    async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
      return await createFile(name, parentId, type);
    },
    handleNavigateToGraphFromQuickSwitcher
  );

  // Add to recent when file changes
  useEffect(() => {
    if (currentFileId) {
      addToRecent(currentFileId);
    }
  }, [currentFileId, addToRecent]);

  return {
    isQuickSwitcherOpen,
    quickSwitcherQuery,
    setQuickSwitcherQuery,
    openQuickSwitcher,
    closeQuickSwitcher,
    filteredCommands
  };
};
