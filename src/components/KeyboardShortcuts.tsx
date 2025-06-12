import React, { useEffect, useCallback } from 'react';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';

interface KeyboardShortcutsProps {
  onQuickSwitcher?: () => void;
  onCommandPalette?: () => void;
  onCreateNote?: () => void;
  onCreateNotebook?: () => void;
  onToggleSidebar?: () => void;
  onFocusMode?: () => void;
  onSearch?: () => void;
  activeView?: string;
  setActiveView?: (view: 'dashboard' | 'notebooks' | 'editor') => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onQuickSwitcher,
  onCommandPalette,
  onCreateNote,
  onCreateNotebook,
  onToggleSidebar,
  onFocusMode,
  onSearch,
  activeView,
  setActiveView
}) => {
  const { createFile, getCurrentFile, updateFile } = useFileSystemContext();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    // Prevent shortcuts when typing in inputs
    const isInInput = (event.target as HTMLElement)?.tagName === 'INPUT' ||
                     (event.target as HTMLElement)?.tagName === 'TEXTAREA' ||
                     (event.target as HTMLElement)?.contentEditable === 'true';

    // Global shortcuts (work even in inputs)
    if (isCtrlOrCmd && event.key === 'k') {
      event.preventDefault();
      if (onQuickSwitcher) {
        onQuickSwitcher();
        toast.success('Quick Switcher aberto');
      }
      return;
    }

    if (isCtrlOrCmd && event.key === 'p') {
      event.preventDefault();
      if (onCommandPalette) {
        onCommandPalette();
        toast.success('Command Palette aberto');
      }
      return;
    }

    // Don't handle other shortcuts if typing in input
    if (isInInput) return;

    // Navigation shortcuts
    if (isCtrlOrCmd && !isShift && !isAlt) {
      switch (event.key) {
        case '1':
          event.preventDefault();
          if (setActiveView) {
            setActiveView('dashboard');
            toast.success('Dashboard ativado');
          }
          break;
        
        case '2':
          event.preventDefault();
          if (setActiveView) {
            setActiveView('notebooks');
            toast.success('Notebooks ativado');
          }
          break;
        
        case '3':
          event.preventDefault();
          if (setActiveView) {
            setActiveView('editor');
            toast.success('Editor ativado');
          }
          break;

        case 'n':
          event.preventDefault();
          if (onCreateNote) {
            onCreateNote();
            toast.success('Nova nota criada');
          }
          break;

        case 's':
          event.preventDefault();
          if (onSearch) {
            onSearch();
            toast.success('Busca ativada');
          }
          break;

        case 'b':
          event.preventDefault();
          if (onToggleSidebar) {
            onToggleSidebar();
            toast.success('Sidebar alternada');
          }
          break;

        case 'f':
          event.preventDefault();
          if (onFocusMode) {
            onFocusMode();
            toast.success('Modo foco ativado');
          }
          break;
      }
    }

    // Shift + Ctrl/Cmd shortcuts
    if (isCtrlOrCmd && isShift && !isAlt) {
      switch (event.key) {
        case 'N':
          event.preventDefault();
          if (onCreateNotebook) {
            onCreateNotebook();
            toast.success('Novo notebook criado');
          }
          break;

        case 'S':
          event.preventDefault();
          const currentFile = getCurrentFile();
          if (currentFile && updateFile) {
            updateFile(currentFile.id, { updatedAt: new Date() });
            toast.success('Nota salva');
          }
          break;

        case 'F':
          event.preventDefault();
          // Toggle full screen
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            toast.success('Modo tela cheia ativado');
          } else {
            document.exitFullscreen();
            toast.success('Modo tela cheia desativado');
          }
          break;
      }
    }

    // Alt shortcuts
    if (isAlt && !isCtrlOrCmd && !isShift) {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          // Navigate back
          window.history.back();
          toast.success('Voltando...');
          break;

        case 'ArrowRight':
          event.preventDefault();
          // Navigate forward
          window.history.forward();
          toast.success('Avançando...');
          break;
      }
    }

    // Single key shortcuts (when not typing)
    if (!isCtrlOrCmd && !isShift && !isAlt) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          // Close any open modals/panels
          const modal = document.querySelector('[role="dialog"]');
          if (modal) {
            (modal.querySelector('[data-dismiss]') as HTMLElement)?.click();
          }
          break;
      }
    }
  }, [
    onQuickSwitcher,
    onCommandPalette,
    onCreateNote,
    onCreateNotebook,
    onToggleSidebar,
    onFocusMode,
    onSearch,
    setActiveView,
    getCurrentFile,
    updateFile
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return null; // This component doesn't render anything
};

// Hook for showing keyboard shortcuts help
export const useKeyboardShortcutsHelp = () => {
  const showHelp = useCallback(() => {
    const shortcuts = [
      { keys: ['Ctrl/Cmd', 'K'], description: 'Abrir Quick Switcher' },
      { keys: ['Ctrl/Cmd', 'P'], description: 'Abrir Command Palette' },
      { keys: ['Ctrl/Cmd', 'N'], description: 'Criar nova nota' },
      { keys: ['Ctrl/Cmd', 'Shift', 'N'], description: 'Criar novo notebook' },
      { keys: ['Ctrl/Cmd', '1'], description: 'Ir para Dashboard' },
      { keys: ['Ctrl/Cmd', '2'], description: 'Ir para Notebooks' },
      { keys: ['Ctrl/Cmd', '3'], description: 'Ir para Editor' },
      { keys: ['Ctrl/Cmd', 'S'], description: 'Buscar' },
      { keys: ['Ctrl/Cmd', 'B'], description: 'Alternar sidebar' },
      { keys: ['Ctrl/Cmd', 'F'], description: 'Modo foco' },
      { keys: ['Ctrl/Cmd', 'Shift', 'S'], description: 'Salvar nota' },
      { keys: ['Ctrl/Cmd', 'Shift', 'F'], description: 'Tela cheia' },
      { keys: ['Alt', '←/→'], description: 'Navegar histórico' },
      { keys: ['Esc'], description: 'Fechar modal' }
    ];

    // Create help modal content
    const helpContent = shortcuts
      .map(shortcut => 
        `<div class="flex justify-between items-center py-2">
          <span class="text-sm text-slate-600">${shortcut.description}</span>
          <div class="flex gap-1">
            ${shortcut.keys.map(key => 
              `<kbd class="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono">${key}</kbd>`
            ).join('')}
          </div>
        </div>`
      ).join('');

    toast.info('Atalhos de Teclado', {
      description: 'Lista de atalhos disponíveis',
      duration: 10000,
      action: {
        label: 'Ver todos',
        onClick: () => {
          // Could open a proper modal here
          console.log('Showing all shortcuts');
        }
      }
    });
  }, []);

  return { showHelp };
}; 