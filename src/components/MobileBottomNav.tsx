
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Search, Settings, Star, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onShowSettings: () => void;
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView = 'dashboard',
  onViewChange,
  onToggleSidebar,
  onOpenSearch,
  onShowSettings,
  className
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Início',
      icon: LayoutDashboard,
      action: () => onViewChange?.('dashboard')
    },
    {
      id: 'files',
      label: 'Arquivos',
      icon: FileText,
      action: onToggleSidebar
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: Search,
      action: onOpenSearch
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: Star,
      action: () => onViewChange?.('favorites')
    },
    {
      id: 'settings',
      label: 'Config',
      icon: Settings,
      action: onShowSettings
    }
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 mobile-nav safe-area-pb animate-slide-up",
      className
    )}>
      {/* Magic indicator bar */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-60"></div>
      
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                "hover:bg-white/10 active:scale-95",
                isActive && "bg-gradient-to-b from-white/20 to-white/5"
              )}
              aria-label={item.label}
            >
              {/* Background glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-active:opacity-20 transition-opacity duration-200",
                "bg-gradient-to-r from-blue-400 to-purple-500"
              )} />
              
              {/* Icon container */}
              <div className={cn(
                "relative z-10 p-2 rounded-xl transition-all duration-300",
                isActive && "bg-gradient-to-r from-blue-500 to-purple-600"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive ? "text-white scale-110" : "text-white/80 group-hover:text-white group-hover:scale-110"
                )} />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium mt-1 transition-all duration-300 relative z-10",
                isActive ? "text-white" : "text-white/70 group-hover:text-white"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-1 w-4 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
