
import React from 'react';
import { ViewTabs, ViewMode } from '@/components/ViewTabs';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu, X, Settings, Zap, Bell } from 'lucide-react';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

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
    <div className="p-4 border-b border-border bg-gradient-to-r from-background to-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Enhanced Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMobileSidebar}
              className={cn(
                "md:hidden h-9 w-9 p-0 rounded-full transition-all duration-200 hover:scale-110",
                isMobileSidebarOpen ? "bg-purple-500/20 text-purple-400" : "hover:bg-purple-500/10"
              )}
            >
              {isMobileSidebarOpen ? 
                <X className="h-4 w-4" /> : 
                <Menu className="h-4 w-4" />
              }
            </Button>
          )}
          
          {/* Enhanced View Tabs */}
          <div className="relative">
            <ViewTabs
              activeView={activeView}
              onViewChange={onViewChange}
            />
            <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-purple-500/50 to-blue-500/50"></div>
          </div>
        </div>
        
        {/* Enhanced Search and Controls */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-md">
          <div className="flex-1">
            <GlobalSearch
              files={files}
              onFileSelect={onFileSelect}
              className="bg-background/60 backdrop-blur-sm border border-border/60 focus-within:border-purple-500/60 focus-within:bg-background transition-all duration-200 rounded-lg"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full hover:bg-blue-500/10 hover:scale-110 transition-all duration-200"
            >
              <Bell className="h-4 w-4 text-muted-foreground hover:text-blue-400" />
            </Button>
            
            {/* AI Assistant */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 hover:scale-110 transition-all duration-200"
            >
              <Zap className="h-4 w-4 text-purple-400" />
            </Button>
            
            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowSettings}
              className="h-9 w-9 p-0 rounded-full hover:bg-gray-500/10 hover:scale-110 transition-all duration-200"
            >
              <Settings className="h-4 w-4 text-muted-foreground hover:text-gray-300" />
            </Button>
            
            {/* Theme Toggle */}
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
    </div>
  );
};
