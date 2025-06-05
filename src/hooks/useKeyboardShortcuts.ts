
import { useEffect } from 'react';
import { ViewMode } from '@/components/ViewTabs';

interface UseKeyboardShortcutsProps {
  onViewChange: (view: ViewMode) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
}

export const useKeyboardShortcuts = ({
  onViewChange,
  onOpenCommandPalette,
  onOpenSettings
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            onViewChange('dashboard');
            break;
          case '2':
            e.preventDefault();
            onViewChange('editor');
            break;
          case '3':
            e.preventDefault();
            onViewChange('graph');
            break;
          case '4':
            e.preventDefault();
            onViewChange('templates');
            break;
          case 'p':
            e.preventDefault();
            onOpenCommandPalette();
            break;
          case ',':
            e.preventDefault();
            onOpenSettings();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange, onOpenCommandPalette, onOpenSettings]);
};
