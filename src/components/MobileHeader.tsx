
import React from 'react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Plus, Menu, Search, Settings } from 'lucide-react';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  files: FileItem[];
  onFileSelect: (fileId: string) => void;
  onCreateFile: (name: string) => void;
  onToggleSidebar: () => void;
  onShowSettings: () => void;
  onOpenSearch: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  files,
  onFileSelect,
  onCreateFile,
  onToggleSidebar,
  onShowSettings,
  onOpenSearch
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10 safe-area-pt animate-slide-up">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
        >
          <Menu className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </Button>

        {/* Center: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            NotesFlow
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSearch}
            className="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
          >
            <Search className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateFile('Nova Nota')}
            className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 group"
          >
            <Plus className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </header>
  );
};
