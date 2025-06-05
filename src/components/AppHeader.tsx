
import React from 'react';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu, X, Settings } from 'lucide-react';
import { FileItem } from '@/types';

interface AppHeaderProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  files: FileItem[];
  onFileSelect: (fileId: string) => void;
  onShowSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  onViewChange,
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  files,
  onFileSelect,
  onShowSettings
}) => {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMobileSidebar}
              className="md:hidden"
            >
              {isMobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
          
          <ViewTabs
            activeView={activeView}
            onViewChange={onViewChange}
          />
        </div>
        
        {/* Search and Controls */}
        <div className="flex items-center gap-4 min-w-0 flex-1 max-w-md">
          <GlobalSearch
            files={files}
            onFileSelect={onFileSelect}
            className="flex-1"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowSettings}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};
