
import React from 'react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/components/ViewTabs';
import { LayoutDashboard, FileText, File, GitBranch, Menu, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onShowSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  onToggleSidebar,
  onOpenSearch,
  onShowSettings
}) => {
  const tabs = [
    { id: 'dashboard' as ViewMode, icon: LayoutDashboard, label: 'Início' },
    { id: 'editor' as ViewMode, icon: FileText, label: 'Editor' },
    { id: 'templates' as ViewMode, icon: File, label: 'Templates' },
    { id: 'graph' as ViewMode, icon: GitBranch, label: 'Grafo' }
  ];

  const handleViewChange = (view: ViewMode) => {
    console.log('[MobileBottomNav] View change:', view);
    onViewChange(view);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mobile-nav safe-area-pb animate-slide-up">
      <div className="flex items-center justify-around h-20 px-2">
        {/* Navigation Tabs */}
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => handleViewChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 min-w-[60px] h-16",
                isActive
                  ? "bg-gradient-to-t from-primary/20 to-primary/10 text-primary scale-110"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className={cn(
                "transition-all duration-300",
                isActive ? "h-6 w-6 scale-110" : "h-5 w-5"
              )} />
              <span className={cn(
                "text-xs font-medium transition-all duration-300",
                isActive ? "text-primary font-semibold" : "text-gray-400"
              )}>
                {tab.label}
              </span>
              
              {isActive && (
                <div className="absolute top-1 w-8 h-1 bg-primary rounded-full animate-pulse-glow" />
              )}
            </Button>
          );
        })}
        
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="flex flex-col items-center gap-1 p-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 min-w-[60px] h-16"
        >
          <Menu className="h-5 w-5" />
          <span className="text-xs font-medium">Menu</span>
        </Button>
      </div>
    </nav>
  );
};
