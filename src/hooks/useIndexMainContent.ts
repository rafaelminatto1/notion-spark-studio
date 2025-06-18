import { useState, useCallback, useMemo } from 'react';
import type { ViewMode } from '@/components/ViewTabs';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';

interface UseIndexMainContentProps {
  setActiveView: (view: ViewMode) => void;
  isMobile: boolean;
  onToggleMobileSidebar: () => void;
}

export const useIndexMainContent = ({
  setActiveView,
  isMobile,
  onToggleMobileSidebar,
}: UseIndexMainContentProps) => {
  const [loginSuccessToast, setLoginSuccessToast] = useState(false);
  const [dashboardTimeRange, setDashboardTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    files: convertedFiles,
    currentFileId,
    setCurrentFileId,
    navigateTo,
    createFile,
    favorites,
  } = useFileSystemContext();

  // Handlers otimizados com useCallback
  const handleViewChangeFromHeader = useCallback((view: ViewMode) => {
    setActiveView(view);
  }, [setActiveView]);

  const handleViewChangeFromWorkspace = useCallback((view: string) => {
    setActiveView(view as ViewMode);
  }, [setActiveView]);

  const handleFileSelect = useCallback((fileId: string) => {
    setCurrentFileId(fileId);
    navigateTo(fileId);
    setActiveView('editor');
    if (isMobile) {
      onToggleMobileSidebar();
    }
  }, [setCurrentFileId, navigateTo, setActiveView, isMobile, onToggleMobileSidebar]);

  const handleCreateFile = useCallback(async (name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fileId = await createFile(name, parentId, type);
      
      if (fileId && type === 'file') {
        handleFileSelect(fileId);
      }
      
      toast.success(`${type === 'file' ? 'Nota' : 'Notebook'} criado${type === 'file' ? 'a' : ''} com sucesso!`, {
        description: `"${name}" foi criado${type === 'file' ? 'a' : ''} com sucesso.`,
        duration: 3000,
      });
      
      return fileId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar arquivo';
      setError(errorMessage);
      toast.error('Erro ao criar arquivo', {
        description: errorMessage,
        duration: 5000,
      });
      console.error('Erro ao criar arquivo:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createFile, handleFileSelect]);

  const handleBreadcrumbNavigate = useCallback((path: string, type: string, id?: string) => {
    switch (type) {
      case 'dashboard':
        setActiveView('dashboard');
        break;
      case 'notebooks':
        setActiveView('evernote');
        break;
      case 'notebook':
        if (id) {
          setCurrentFileId(id);
          navigateTo(id);
        }
        setActiveView('evernote');
        break;
      case 'note':
        if (id) {
          setCurrentFileId(id);
          navigateTo(id);
          setActiveView('editor');
        }
        break;
    }
  }, [setActiveView, setCurrentFileId, navigateTo]);

  // Função para encontrar o notebook pai do arquivo atual
  const getCurrentNotebookId = useMemo((): string | undefined => {
    if (!currentFileId) return undefined;
    
    const currentFile = convertedFiles.find(f => f.id === currentFileId);
    if (!currentFile) return undefined;
    
    // Se o arquivo atual é um folder, retorna o próprio ID
    if (currentFile.type === 'folder') {
      return currentFile.id;
    }
    
    // Se tem parentId, tenta encontrar o folder pai
    if (currentFile.parentId) {
      const parentFile = convertedFiles.find(f => f.id === currentFile.parentId);
      if (parentFile && parentFile.type === 'folder') {
        return parentFile.id;
      }
    }
    
    return undefined;
  }, [currentFileId, convertedFiles]);

  // Handlers memoizados para componentes filhos
  const memoizedHandlers = useMemo(() => ({
    onCreateNote: () => handleCreateFile('Nova Nota'),
    onCreateNotebook: () => handleCreateFile('Novo Notebook', undefined, 'folder'),
    onOpenSearch: () => {}, // Será definido no componente principal
  }), [handleCreateFile]);

  return {
    // Estado
    loginSuccessToast,
    setLoginSuccessToast,
    dashboardTimeRange,
    setDashboardTimeRange,
    isLoading,
    error,
    
    // Dados do contexto
    convertedFiles,
    currentFileId,
    favorites,
    
    // Handlers
    handleViewChangeFromHeader,
    handleViewChangeFromWorkspace,
    handleFileSelect,
    handleCreateFile,
    handleBreadcrumbNavigate,
    
    // Computed values
    getCurrentNotebookId,
    memoizedHandlers,
  };
}; 