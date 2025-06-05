
import { useState, useCallback } from 'react';

interface UsePanelCollapseProps {
  defaultCollapsed?: Record<string, boolean>;
}

export const usePanelCollapse = ({ defaultCollapsed = {} }: UsePanelCollapseProps = {}) => {
  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>(defaultCollapsed);

  const toggleCollapse = useCallback((panelId: string) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  }, []);

  const setCollapsed = useCallback((panelId: string, collapsed: boolean) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panelId]: collapsed
    }));
  }, []);

  const isCollapsed = useCallback((panelId: string) => {
    return collapsedPanels[panelId] || false;
  }, [collapsedPanels]);

  return {
    collapsedPanels,
    toggleCollapse,
    setCollapsed,
    isCollapsed
  };
};
