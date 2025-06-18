import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onReset?: () => void;
  onTogglePathFinding?: () => void;
  onToggleSettings?: () => void;
  onToggleMinimap?: () => void;
  onToggleAnalytics?: () => void;
  onToggleHelp?: () => void;
  onTogglePerformance?: () => void;
  onChangeLayout?: (layout: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
}

export function useKeyboardShortcuts({
  onReset,
  onTogglePathFinding,
  onToggleSettings,
  onToggleMinimap,
  onToggleAnalytics,
  onToggleHelp,
  onTogglePerformance,
  onChangeLayout,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevenir atalhos quando em inputs
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isModKey = ctrlKey || metaKey;

    switch (key.toLowerCase()) {
      // Reset - R
      case 'r':
        if (!isModKey) {
          event.preventDefault();
          onReset?.();
        }
        break;

      // Path Finding - P
      case 'p':
        if (!isModKey) {
          event.preventDefault();
          onTogglePathFinding?.();
        }
        break;

      // Settings - S
      case 's':
        if (!isModKey) {
          event.preventDefault();
          onToggleSettings?.();
        }
        break;

      // Minimap - M
      case 'm':
        if (!isModKey) {
          event.preventDefault();
          onToggleMinimap?.();
        }
        break;

      // Analytics - A
      case 'a':
        if (!isModKey) {
          event.preventDefault();
          onToggleAnalytics?.();
        }
        break;

      // Performance Dashboard - D
      case 'd':
        if (!isModKey) {
          event.preventDefault();
          onTogglePerformance?.();
        }
        break;

      // Help - ?
      case '?':
      case '/':
        if (shiftKey || key === '?') {
          event.preventDefault();
          onToggleHelp?.();
        }
        break;

      // Layouts - 1-5
      case '1':
        if (!isModKey) {
          event.preventDefault();
          onChangeLayout?.('force');
        }
        break;
      case '2':
        if (!isModKey) {
          event.preventDefault();
          onChangeLayout?.('hierarchical');
        }
        break;
      case '3':
        if (!isModKey) {
          event.preventDefault();
          onChangeLayout?.('circular');
        }
        break;
      case '4':
        if (!isModKey) {
          event.preventDefault();
          onChangeLayout?.('timeline');
        }
        break;
      case '5':
        if (!isModKey) {
          event.preventDefault();
          onChangeLayout?.('cluster');
        }
        break;

      // Zoom - + / -
      case '+':
      case '=':
        if (!isModKey) {
          event.preventDefault();
          onZoomIn?.();
        }
        break;
      case '-':
        if (!isModKey) {
          event.preventDefault();
          onZoomOut?.();
        }
        break;

      // Zoom Fit - F
      case 'f':
        if (!isModKey) {
          event.preventDefault();
          onZoomFit?.();
        }
        break;

      // Escape - cancelar pathfinding
      case 'escape':
        event.preventDefault();
        onTogglePathFinding?.();
        break;
    }
  }, [
    onReset,
    onTogglePathFinding,
    onToggleSettings,
    onToggleMinimap,
    onToggleAnalytics,
    onToggleHelp,
    onTogglePerformance,
    onChangeLayout,
    onZoomIn,
    onZoomOut,
    onZoomFit,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { key: 'R', description: 'Reset filtros' },
      { key: 'P', description: 'Toggle pathfinding' },
      { key: 'S', description: 'Configurações' },
      { key: 'M', description: 'Toggle minimap' },
      { key: 'A', description: 'Toggle analytics' },
      { key: 'D', description: 'Performance dashboard' },
      { key: '?', description: 'Mostrar ajuda' },
      { key: '1-5', description: 'Mudar layout' },
      { key: '+/-', description: 'Zoom in/out' },
      { key: 'F', description: 'Zoom fit' },
      { key: 'ESC', description: 'Cancelar ação' },
    ],
  };
}
