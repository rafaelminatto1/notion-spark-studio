
import { useState, useCallback, useEffect } from 'react';
import { FileItem } from '@/types';

export interface QuickSwitcherCommand {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: () => void;
  category: 'file' | 'command' | 'create';
}

export const useQuickSwitcher = (
  files: FileItem[],
  onFileSelect: (fileId: string) => void,
  onCreateFile: (name: string) => void,
  onNavigateToGraph?: () => void
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

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

  // Comandos do sistema
  const systemCommands: QuickSwitcherCommand[] = [
    {
      id: 'graph-view',
      label: 'Abrir Graph View',
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
      label: 'Nova Página',
      description: 'Criar uma nova página',
      icon: 'FileText',
      action: () => {
        const name = query.startsWith('+ ') ? query.slice(2) : 'Nova Página';
        onCreateFile(name);
        close();
      },
      category: 'create'
    }
  ];

  // Filtrar arquivos por query
  const getFilteredFiles = useCallback((): QuickSwitcherCommand[] => {
    if (!query) return [];

    return files
      .filter(file => 
        file.type === 'file' && 
        file.name.toLowerCase().includes(query.toLowerCase())
      )
      .map(file => ({
        id: file.id,
        label: file.name,
        description: file.tags?.join(', '),
        icon: 'FileText',
        action: () => {
          onFileSelect(file.id);
          close();
        },
        category: 'file' as const
      }));
  }, [files, query, onFileSelect, close]);

  // Filtrar comandos por query
  const getFilteredCommands = useCallback((): QuickSwitcherCommand[] => {
    if (!query) return systemCommands;

    return systemCommands.filter(command =>
      command.label.toLowerCase().includes(query.toLowerCase()) ||
      command.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  // Comando para criar novo arquivo baseado na query
  const getCreateCommand = useCallback((): QuickSwitcherCommand[] => {
    if (!query || query.startsWith('+ ')) return [];

    return [{
      id: 'create-from-query',
      label: `Criar "${query}"`,
      description: 'Criar nova página com este nome',
      icon: 'Plus',
      action: () => {
        onCreateFile(query);
        close();
      },
      category: 'create'
    }];
  }, [query, onCreateFile, close]);

  // Todos os comandos filtrados
  const filteredCommands = useCallback((): QuickSwitcherCommand[] => {
    const files = getFilteredFiles();
    const commands = getFilteredCommands();
    const createCommands = getCreateCommand();

    return [...files, ...commands, ...createCommands];
  }, [getFilteredFiles, getFilteredCommands, getCreateCommand]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
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
    filteredCommands: filteredCommands()
  };
};
