
import React, { useState, useEffect } from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { WorkspaceSettings } from '@/components/WorkspaceSettings';
import { AppHeader } from '@/components/AppHeader';
import { UserProfileButton } from '@/components/UserProfileButton';
import { Button } from '@/components/ui/button';
import { useSupabaseFiles } from '@/hooks/useSupabaseFiles';
import { useSupabaseProfile } from '@/hooks/useSupabaseProfile';
import { useQuickSwitcher } from '@/hooks/useQuickSwitcher';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigation } from '@/hooks/useNavigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMobileDetection } from '@/hooks/useMobileDetection';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  
  const isMobile = useMobileDetection();
  
  const { files, loading: filesLoading, createFile, updateFile } = useSupabaseFiles();
  const { profile, preferences } = useSupabaseProfile();
  const { favorites } = useFavorites();
  const { navigateTo } = useNavigation();

  // Convert Supabase files to the format expected by existing components
  const convertedFiles = files.map(file => ({
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

  const handleNavigateToFile = (fileId: string) => {
    setCurrentFileId(fileId);
    navigateTo(fileId);
    setActiveView('editor');
  };

  const handleCreateFromTemplate = async (template: any) => {
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
  };

  const handleNavigateToGraph = () => {
    setActiveView('graph');
  };

  const handleViewChange = (view: ViewMode) => {
    setActiveView(view);
  };

  const handleCreateFile = async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    return await createFile(name, parentId, type);
  };

  const handleUpdateFile = async (id: string, updates: any) => {
    await updateFile(id, updates);
  };

  // Create wrapper functions with correct signatures
  const handleViewChangeFromKeyboard = (view: ViewMode) => {
    setActiveView(view);
  };

  const handleNavigateToGraphFromQuickSwitcher = () => {
    setActiveView('graph');
  };

  // Create wrapper function for AppHeader that accepts string and converts to ViewMode
  const handleViewChangeFromHeader = (view: string) => {
    setActiveView(view as ViewMode);
  };

  // Create wrapper function for WorkspaceLayout that accepts string and converts to ViewMode
  const handleViewChangeFromWorkspace = (view: string) => {
    setActiveView(view as ViewMode);
  };

  useKeyboardShortcuts({
    onViewChange: handleViewChangeFromKeyboard,
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenSettings: () => setShowWorkspaceSettings(true)
  });

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

  if (showWorkspaceSettings) {
    return (
      <ThemeProvider>
        <WorkspaceProvider>
          <div className="min-h-screen bg-background">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowWorkspaceSettings(false)}
              >
                ← Voltar
              </Button>
              <h1 className="text-lg font-semibold">Configurações do Workspace</h1>
              <UserProfileButton onShowSettings={() => setShowWorkspaceSettings(true)} />
            </div>
            <WorkspaceSettings />
          </div>
        </WorkspaceProvider>
      </ThemeProvider>
    );
  }

  if (filesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background text-foreground flex w-full">
          {/* Mobile Sidebar Backdrop */}
          {isMobile && isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <AppHeader
              activeView={activeView}
              onViewChange={handleViewChangeFromHeader}
              isMobile={isMobile}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              files={convertedFiles}
              onFileSelect={(fileId: string) => {
                setCurrentFileId(fileId);
                navigateTo(fileId);
                setActiveView('editor');
              }}
              onShowSettings={() => setShowWorkspaceSettings(true)}
            />

            {/* Content Area */}
            <WorkspaceLayout
              activeView={activeView}
              onViewChange={handleViewChangeFromWorkspace}
              onNavigateToFile={(fileId: string) => {
                setCurrentFileId(fileId);
                navigateTo(fileId);
                setActiveView('editor');
              }}
              onCreateFile={async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
                return await createFile(name, parentId, type);
              }}
            />
          </div>

          {/* Quick Switcher */}
          <QuickSwitcher
            isOpen={isQuickSwitcherOpen}
            onClose={closeQuickSwitcher}
            commands={filteredCommands}
            query={quickSwitcherQuery}
            onQueryChange={setQuickSwitcherQuery}
          />

          {/* Command Palette */}
          <CommandPalette
            files={convertedFiles}
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onFileSelect={(fileId: string) => {
              setCurrentFileId(fileId);
              navigateTo(fileId);
              setActiveView('editor');
            }}
            onCreateFile={async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
              return await createFile(name, parentId, type);
            }}
            favorites={favorites}
          />
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};

export default Index;
