import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, GitBranch, LayoutDashboard, File, Notebook } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'dashboard' | 'editor' | 'graph' | 'templates' | 'evernote';

interface ViewTabsProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isMobile?: boolean;
  className?: string;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
  activeView,
  onViewChange,
  isMobile,
  className
}) => {
  const tabs = [
    {
      id: 'evernote' as ViewMode,
      label: 'Notebooks',
      shortLabel: 'Notes',
      icon: Notebook,
      description: 'Layout estilo Evernote'
    },
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      description: 'Visão geral dos arquivos'
    },
    {
      id: 'editor' as ViewMode,
      label: 'Editor',
      shortLabel: 'Edit',
      icon: FileText,
      description: 'Editor de notas'
    },
    {
      id: 'templates' as ViewMode,
      label: 'Templates',
      shortLabel: 'Temp',
      icon: File,
      description: 'Modelos de notas'
    },
    {
      id: 'graph' as ViewMode,
      label: 'Graph',
      shortLabel: 'Graf',
      icon: GitBranch,
      description: 'Visualização em grafo'
    }
  ];

  const handleTabClick = (tabId: ViewMode, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('[ViewTabs] Changing view to:', tabId);
    console.log('[ViewTabs] Current activeView:', activeView);
    console.log('[ViewTabs] onViewChange function:', typeof onViewChange);
    
    try {
      onViewChange(tabId);
      console.log('[ViewTabs] View change called successfully');
    } catch (error) {
      console.error('[ViewTabs] Error calling onViewChange:', error);
    }
  };

  return (
    <div className={cn(
      "flex gap-0.5 p-0.5 bg-background/95 backdrop-blur-sm rounded-lg border border-border/60 overflow-hidden shadow-sm",
      isMobile ? "w-auto" : "w-auto",
      className
    )}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={(event) => { handleTabClick(tab.id, event); }}
            className={cn(
              "relative gap-1.5 transition-all duration-200 text-xs font-medium rounded-md",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:ring-1 focus-visible:ring-primary/50",
              "cursor-pointer select-none whitespace-nowrap",
              isMobile ? "px-2 py-1.5 h-8" : "px-3 py-2 h-9",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/90 hover:text-foreground border-transparent hover:border-accent/30"
            )}
            title={tab.description}
            type="button"
          >
            <Icon className={cn(
              "transition-all duration-200 flex-shrink-0",
              "h-3.5 w-3.5",
              isActive ? "scale-105" : ""
            )} />
            <span className={cn(
              "font-medium transition-all duration-200 truncate",
              isMobile ? "text-xs" : "text-xs lg:text-sm",
              isActive ? "font-semibold" : ""
            )}>
              {isMobile ? tab.shortLabel : tab.label}
            </span>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute inset-0 bg-primary/5 rounded-md pointer-events-none" />
            )}
          </Button>
        );
      })}
    </div>
  );
};
