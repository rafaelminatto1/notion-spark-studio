import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCommandPaletteOptions {
  defaultShortcut?: string;
  context?: string;
  enabled?: boolean;
}

export const useCommandPalette = (options: UseCommandPaletteOptions = {}) => {
  const {
    defaultShortcut = 'cmd+k,ctrl+k',
    context = 'global',
    enabled = true
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState(context);
  const keydownHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // Função para abrir o palette
  const openPalette = useCallback(() => {
    if (enabled) {
      setIsOpen(true);
    }
  }, [enabled]);

  // Função para fechar o palette
  const closePalette = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Função para alternar o palette
  const togglePalette = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Atualizar contexto
  const updateContext = useCallback((newContext: string) => {
    setCurrentContext(newContext);
  }, []);

  // Parser de shortcuts mais robusto
  const parseShortcut = useCallback((shortcut: string) => {
    return shortcut.split(',').map(combo => {
      const keys = combo.trim().toLowerCase().split('+');
      return {
        ctrl: keys.includes('ctrl'),
        cmd: keys.includes('cmd'),
        shift: keys.includes('shift'),
        alt: keys.includes('alt'),
        key: keys[keys.length - 1]
      };
    });
  }, []);

  // Verificar se o evento de teclado corresponde ao shortcut
  const matchesShortcut = useCallback((event: KeyboardEvent, shortcutCombos: ReturnType<typeof parseShortcut>) => {
    return shortcutCombos.some(combo => {
      const metaKey = combo.cmd && (event.metaKey || event.ctrlKey);
      const ctrlKey = combo.ctrl && event.ctrlKey;
      const shiftKey = combo.shift ? event.shiftKey : !event.shiftKey;
      const altKey = combo.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === combo.key;

      return (metaKey || ctrlKey) && shiftKey && altKey && keyMatch;
    });
  }, []);

  // Configurar listeners de teclado
  useEffect(() => {
    if (!enabled) return;

    const shortcutCombos = parseShortcut(defaultShortcut);
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Não ativar se o usuário estiver digitando em um input ou textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      if (matchesShortcut(event, shortcutCombos)) {
        event.preventDefault();
        event.stopPropagation();
        togglePalette();
      }

      // ESC para fechar
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        closePalette();
      }
    };

    keydownHandlerRef.current = handleKeyDown;
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (keydownHandlerRef.current) {
        document.removeEventListener('keydown', keydownHandlerRef.current);
      }
    };
  }, [enabled, defaultShortcut, isOpen, togglePalette, closePalette, parseShortcut, matchesShortcut]);

  // Prevenir scroll do body quando o palette estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Log de debug (pode ser removido em produção)
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log(`Command Palette: ${isOpen ? 'opened' : 'closed'} in context: ${currentContext}`);
    }
  }, [isOpen, currentContext]);

  return {
    isOpen,
    currentContext,
    openPalette,
    closePalette,
    togglePalette,
    updateContext,
    enabled
  };
}; 