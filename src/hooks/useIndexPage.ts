import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ViewMode } from '@/components/ViewTabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export const useIndexPage = () => {
  console.log('[useIndexPage] Hook starting');
  
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  
  console.log('[useIndexPage] State initialized. Initial activeView:', activeView);

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
        // Only set default view to editor if there's a current file or if it's explicitly dashboard
        if (preferences.default_view === 'editor' && !currentFileId) {
          // If preference is editor but no file is selected, keep dashboard as default
          setActiveView('dashboard');
          console.log('[useIndexPage] Preference is editor but no file selected, defaulting to dashboard.');
        } else {
          setActiveView(preferences.default_view);
          console.log('[useIndexPage] Setting activeView from preferences to:', preferences.default_view);
        }
      }
    }, [preferences, loadingPreferences, currentFileId, setActiveView]);

    const handleNavigateToFile = useCallback((fileId: string) => {
      console.log('[useIndexPage] handleNavigateToFile called with fileId:', fileId);
      setCurrentFileId(fileId);
      navigateTo(fileId);
      setActiveView('editor');
      console.log('[useIndexPage] activeView set to editor. currentFileId:', fileId);
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
      console.log('[useIndexPage] handleViewChange called with view:', view);
      setActiveView(view);
      console.log('[useIndexPage] activeView updated to:', view);
    }, []);

    const handleCreateFile = useCallback(async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
      console.log('[useIndexPage] handleCreateFile called with:', name, parentId, type);
      const fileId = await createFile(name, parentId, type);
      console.log('[useIndexPage] File created with ID:', fileId);
      if (fileId) {
        handleNavigateToFile(fileId);
      }
      return fileId || '';
    }, [createFile, handleNavigateToFile]);

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
