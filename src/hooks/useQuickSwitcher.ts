
import { useState, useCallback, useEffect } from 'react';
import { FileItem } from '@/types';

export interface QuickSwitcherCommand {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: () => void;
  category: 'file' | 'command' | 'create' | 'recent';
  score?: number;
}

export const useQuickSwitcher = (
  files: FileItem[],
  onFileSelect: (fileId: string) => void,
  onCreateFile: (name: string) => void,
  onNavigateToGraph?: () => void
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  // Adicionar arquivo aos recentes
  const addToRecent = useCallback((fileId: string) => {
    setRecentFiles(prev => {
      const filtered = prev.filter(id => id !== fileId);
      return [fileId, ...filtered].slice(0, 10); // Manter apenas os 10 mais recentes
    });
  }, []);

  // Comandos do sistema
  const systemCommands: QuickSwitcherCommand[] = [
    {
      id: 'graph-view',
      label: 'Open Graph View',
      description: 'Visualizar conexões entre arquivos',
      icon: 'GitBranch',
      action: () => {
        onNavigateToGraph?.();
        close();
      },
      category: 'command'
    },
    {
      id: 'new-file',
      label: 'Create New Note',
      description: 'Criar uma nova nota',
      icon: 'FileText',
      action: () => {
        const name = query.startsWith('+ ') ? query.slice(2) : query || 'Untitled';
        onCreateFile(name);
        close();
      },
      category: 'create'
    }
  ];

  // Função de fuzzy search melhorada
  const fuzzyMatch = (text: string, query: string): number => {
    if (!query) return 1;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match has highest score
    if (textLower === queryLower) return 100;
    if (textLower.startsWith(queryLower)) return 90;
    if (textLower.includes(queryLower)) return 80;
    
    // Fuzzy matching
    let score = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        score += 10;
        queryIndex++;
      }
    }
    
    return queryIndex === query.length ? score : 0;
  };

  // Filtrar arquivos por query com fuzzy search
  const getFilteredFiles = useCallback((): QuickSwitcherCommand[] => {
    if (!query && recentFiles.length === 0) return [];

    let filesToShow = files.filter(file => file.type === 'file');
    
    if (!query) {
      // Mostrar arquivos recentes quando não há query
      const recentFileItems = recentFiles
        .map(id => files.find(f => f.id === id))
        .filter(Boolean) as FileItem[];
      filesToShow = recentFileItems.slice(0, 5);
    }

    return filesToShow
      .map(file => ({
        id: file.id,
        label: file.name,
        description: file.tags?.join(', ') || 'No tags',
        icon: 'FileText',
        action: () => {
          onFileSelect(file.id);
          addToRecent(file.id);
          close();
        },
        category: (!query && recentFiles.includes(file.id)) ? 'recent' as const : 'file' as const,
        score: query ? fuzzyMatch(file.name, query) : 1
      }))
      .filter(cmd => !query || cmd.score! > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [files, query, onFileSelect, close, addToRecent, recentFiles]);

  // Filtrar comandos por query
  const getFilteredCommands = useCallback((): QuickSwitcherCommand[] => {
    if (query && query.length < 2) return [];

    return systemCommands
      .map(command => ({
        ...command,
        score: query ? fuzzyMatch(command.label + ' ' + (command.description || ''), query) : 1
      }))
      .filter(command => !query || command.score! > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [query]);

  // Comando para criar novo arquivo baseado na query
  const getCreateCommand = useCallback((): QuickSwitcherCommand[] => {
    if (!query || query.length < 2) return [];

    // Verificar se já existe um arquivo com esse nome
    const existingFile = files.find(f => 
      f.type === 'file' && 
      f.name.toLowerCase() === query.toLowerCase()
    );

    if (existingFile) return [];

    return [{
      id: 'create-from-query',
      label: `Create "${query}"`,
      description: 'Create new note with this name',
      icon: 'Plus',
      action: () => {
        onCreateFile(query);
        close();
      },
      category: 'create' as const,
      score: 95
    }];
  }, [query, onCreateFile, close, files]);

  // Todos os comandos filtrados
  const filteredCommands = useCallback((): QuickSwitcherCommand[] => {
    const files = getFilteredFiles();
    const commands = getFilteredCommands();
    const createCommands = getCreateCommand();

    return [...files, ...commands, ...createCommands]
      .sort((a, b) => {
        // Priorizar categoria
        const categoryOrder = { recent: 4, file: 3, command: 2, create: 1 };
        const categoryDiff = (categoryOrder[b.category] || 0) - (categoryOrder[a.category] || 0);
        if (categoryDiff !== 0) return categoryDiff;
        
        // Depois por score
        return (b.score || 0) - (a.score || 0);
      });
  }, [getFilteredFiles, getFilteredCommands, getCreateCommand]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toggle();
      }
      
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, isOpen, close]);

  return {
    isOpen,
    query,
    setQuery,
    open,
    close,
    filteredCommands: filteredCommands(),
    addToRecent
  };
};
