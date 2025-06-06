
import { useEffect, useMemo } from 'react';
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
  console.log('[useIndexQuickSwitcher] Hook starting');

  try {
    const handleNavigateToGraphFromQuickSwitcher = () => {
      console.log('[useIndexQuickSwitcher] Navigate to graph');
      setActiveView('graph');
    };

    const handleNavigateToFile = useMemo(() => (fileId: string) => {
      console.log('[useIndexQuickSwitcher] Navigate to file:', fileId);
      setCurrentFileId(fileId);
      navigateTo(fileId);
      setActiveView('editor');
    }, [setCurrentFileId, navigateTo, setActiveView]);

    const handleCreateFile = useMemo(() => async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
      console.log('[useIndexQuickSwitcher] Create file:', name);
      return await createFile(name, parentId, type);
    }, [createFile]);

    console.log('[useIndexQuickSwitcher] Handlers created, initializing useQuickSwitcher');

    const quickSwitcherResult = useQuickSwitcher(
      convertedFiles,
      handleNavigateToFile,
      handleCreateFile,
      handleNavigateToGraphFromQuickSwitcher
    );

    console.log('[useIndexQuickSwitcher] useQuickSwitcher completed');

    const {
      isOpen: isQuickSwitcherOpen,
      query: quickSwitcherQuery,
      setQuery: setQuickSwitcherQuery,
      open: openQuickSwitcher,
      close: closeQuickSwitcher,
      filteredCommands,
      addToRecent
    } = quickSwitcherResult;

    // Add to recent when file changes
    useEffect(() => {
      if (currentFileId) {
        console.log('[useIndexQuickSwitcher] Adding to recent:', currentFileId);
        addToRecent(currentFileId);
      }
    }, [currentFileId, addToRecent]);

    console.log('[useIndexQuickSwitcher] Hook completed successfully');

    return {
      isQuickSwitcherOpen,
      quickSwitcherQuery,
      setQuickSwitcherQuery,
      openQuickSwitcher,
      closeQuickSwitcher,
      filteredCommands
    };
  } catch (error) {
    console.error('[useIndexQuickSwitcher] Error in hook:', error);
    throw error;
  }
};
