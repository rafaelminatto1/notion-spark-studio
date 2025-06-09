import { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export const useIndexPage = () => {
  console.log('[useIndexPage] Hook starting');
  
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  
  console.log('[useIndexPage] State initialized');

  try {
    const isMobile = useIsMobile();
    console.log('[useIndexPage] Mobile detection completed');
    
    const {
      files: convertedFiles,
      loading: filesLoading,
      currentFileId,
      setCurrentFileId,
      navigateTo,
      createFile,
      updateFile,
      favorites,
    } = useFileSystemContext();

    console.log('[useIndexPage] FileSystemContext hooks completed');
    
    const { preferences, loadingPreferences } = useUserPreferences();
    console.log('[useIndexPage] User preferences hook completed');

    console.log('[useIndexPage] Files converted successfully, converted count:', convertedFiles.length);

    // Close mobile sidebar when view changes
    useEffect(() => {
      if (isMobile) {
        setIsMobileSidebarOpen(false);
      }
    }, [activeView, isMobile]);

    // Set default view based on user preferences
    useEffect(() => {
      if (!loadingPreferences && preferences?.default_view) {
        setActiveView(preferences.default_view);
      }
    }, [preferences, loadingPreferences]);

    const handleNavigateToFile = useCallback((fileId: string) => {
      console.log('[useIndexPage] handleNavigateToFile called with:', fileId);
      setCurrentFileId(fileId);
      navigateTo(fileId);
      setActiveView('editor');
    }, [setCurrentFileId, navigateTo, setActiveView]);

    const handleCreateFromTemplate = useCallback(async (template: any) => {
      console.log('[useIndexPage] handleCreateFromTemplate called');
      const fileId = await createFile(
        template.name, 
        undefined, 
        'file', 
        template.content,
        template.emoji
      );
      
      if (fileId) {
        handleNavigateToFile(fileId);
      }
    }, [createFile, handleNavigateToFile]);

    const handleViewChange = useCallback((view: ViewMode) => {
      console.log('[useIndexPage] handleViewChange called with:', view);
      setActiveView(view);
    }, []);

    const handleCreateFile = useCallback(async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
      console.log('[useIndexPage] handleCreateFile called with:', name, parentId, type);
      const fileId = await createFile(name, parentId, type);
      console.log('[useIndexPage] File created with ID:', fileId);
      return fileId || '';
    }, [createFile]);

    const handleUpdateFile = useCallback(async (id: string, updates: any) => {
      console.log('[useIndexPage] handleUpdateFile called with:', id);
      await updateFile(id, updates);
    }, [updateFile]);

    console.log('[useIndexPage] All handlers created successfully');

    return {
      // State
      activeView,
      isMobileSidebarOpen,
      isCommandPaletteOpen,
      showWorkspaceSettings,
      currentFileId,
      isMobile,
      filesLoading,
      convertedFiles,
      favorites,
      
      // State setters
      setActiveView,
      setIsMobileSidebarOpen,
      setIsCommandPaletteOpen,
      setShowWorkspaceSettings,
      setCurrentFileId,
      
      // Handlers
      handleNavigateToFile,
      handleCreateFromTemplate,
      handleViewChange,
      handleCreateFile,
      handleUpdateFile,
      navigateTo
    };
  } catch (error) {
    console.error('[useIndexPage] Error in hook:', error);
    throw error;
  }
};
