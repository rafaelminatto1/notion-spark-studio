
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { useSupabaseFiles } from '@/hooks/useSupabaseFiles';
import { useSupabaseProfile } from '@/hooks/useSupabaseProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { useMobileDetection } from '@/hooks/useMobileDetection';

export const useIndexPage = () => {
  console.log('[useIndexPage] Hook starting');
  
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  
  console.log('[useIndexPage] State initialized');

  try {
    const isMobile = useMobileDetection();
    console.log('[useIndexPage] Mobile detection completed');
    
    const { files, loading: filesLoading, createFile, updateFile } = useSupabaseFiles();
    console.log('[useIndexPage] Supabase files hook completed, files:', files.length);
    
    const { profile, preferences } = useSupabaseProfile();
    console.log('[useIndexPage] Supabase profile hook completed');
    
    const { favorites } = useFavorites();
    console.log('[useIndexPage] Favorites hook completed');
    
    const { navigateTo } = useNavigation();
    console.log('[useIndexPage] Navigation hook completed');

    // Convert Supabase files to the format expected by existing components
    const convertedFiles = useMemo(() => {
      console.log('[useIndexPage] Converting files, count:', files.length);
      return files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type as 'file' | 'folder',
        parentId: file.parent_id,
        content: file.content,
        emoji: file.emoji,
        description: file.description,
        tags: file.tags,
        isProtected: file.is_protected,
        isPublic: file.is_public,
        showInSidebar: file.show_in_sidebar,
        createdAt: new Date(file.created_at),
        updatedAt: new Date(file.updated_at)
      }));
    }, [files]);

    console.log('[useIndexPage] Files converted successfully');

    // Close mobile sidebar when view changes
    useEffect(() => {
      if (isMobile) {
        setIsMobileSidebarOpen(false);
      }
    }, [activeView, isMobile]);

    // Set default view based on user preferences
    useEffect(() => {
      if (preferences?.default_view) {
        setActiveView(preferences.default_view);
      }
    }, [preferences]);

    const handleNavigateToFile = useCallback((fileId: string) => {
      console.log('[useIndexPage] handleNavigateToFile called with:', fileId);
      setCurrentFileId(fileId);
      navigateTo(fileId);
      setActiveView('editor');
    }, [navigateTo]);

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
      return await createFile(name, parentId, type);
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
