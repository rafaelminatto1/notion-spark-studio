
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
      icon: Notebook,
      description: 'Layout estilo Evernote'
    },
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral dos arquivos'
    },
    {
      id: 'editor' as ViewMode,
      label: 'Editor',
      icon: FileText,
      description: 'Editor de notas'
    },
    {
      id: 'templates' as ViewMode,
      label: 'Templates',
      icon: File,
      description: 'Modelos de notas'
    },
    {
      id: 'graph' as ViewMode,
      label: 'Graph',
      icon: GitBranch,
      description: 'Visualização em grafo'
    }
  ];

  const handleTabClick = (tabId: ViewMode) => {
    console.log('[ViewTabs] Changing view to:', tabId);
    onViewChange(tabId);
  };

  return (
    <div className={cn(
      "flex gap-1 p-1 bg-background/80 backdrop-blur-sm rounded-xl border border-border/40",
      isMobile ? "w-full overflow-x-auto" : "",
      className
    )}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size={isMobile ? "sm" : "sm"}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "relative gap-2 transition-all duration-300 text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 rounded-lg",
              "hover:bg-accent/80 hover:text-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm scale-105"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={tab.description}
          >
            <Icon className={cn(
              "transition-all duration-300",
              isMobile ? "h-4 w-4" : "h-4 w-4",
              isActive ? "scale-110" : ""
            )} />
            <span className={cn(
              "font-medium transition-all duration-300",
              isMobile ? "hidden xs:inline" : "inline",
              isActive ? "font-semibold" : ""
            )}>
              {tab.label}
            </span>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute inset-0 bg-primary/10 rounded-lg animate-pulse-glow" />
            )}
          </Button>
        );
      })}
    </div>
  );
};
