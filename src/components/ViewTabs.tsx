
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, GitBranch, LayoutDashboard, FileTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'dashboard' | 'editor' | 'graph' | 'templates';

interface ViewTabsProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
  activeView,
  onViewChange,
  className
}) => {
  const tabs = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'editor' as ViewMode,
      label: 'Editor',
      icon: FileText
    },
    {
      id: 'templates' as ViewMode,
      label: 'Templates',
      icon: FileTemplate
    },
    {
      id: 'graph' as ViewMode,
      label: 'Graph View',
      icon: GitBranch
    }
  ];

  return (
    <div className={cn("flex gap-1 p-1 bg-notion-dark-hover rounded-lg", className)}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onViewChange(tab.id)}
            className={cn(
              "gap-2 transition-all",
              activeView === tab.id
                ? "bg-notion-purple text-white"
                : "text-gray-400 hover:text-white hover:bg-notion-dark-hover"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
