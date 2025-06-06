
import { useCallback } from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface UseIndexKeyboardShortcutsProps {
  setActiveView: (view: ViewMode) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setShowWorkspaceSettings: (show: boolean) => void;
}

export const useIndexKeyboardShortcuts = ({
  setActiveView,
  setIsCommandPaletteOpen,
  setShowWorkspaceSettings
}: UseIndexKeyboardShortcutsProps) => {
  const handleViewChangeFromKeyboard = useCallback((view: ViewMode) => {
    setActiveView(view);
  }, [setActiveView]);

  useKeyboardShortcuts({
    onViewChange: handleViewChangeFromKeyboard,
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenSettings: () => setShowWorkspaceSettings(true)
  });
};
