import React, { useMemo } from 'react';
import { ChevronRight, Home, Book, FileText, Folder, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSystemContext } from '@/contexts/FileSystemContext';

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'dashboard' | 'notebooks' | 'notebook' | 'note' | 'folder';
  icon: React.ReactNode;
  path: string;
}

interface BreadcrumbsNavProps {
  activeView: string;
  currentNoteId?: string | null;
  currentNotebookId?: string | null;
  onNavigate: (path: string, type: string, id?: string) => void;
  className?: string;
}

export const BreadcrumbsNav: React.FC<BreadcrumbsNavProps> = ({
  activeView,
  currentNoteId,
  currentNotebookId,
  onNavigate,
  className
}) => {
  const { files, getCurrentFile } = useFileSystemContext();

  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    // Always start with dashboard
    items.push({
      id: 'dashboard',
      name: 'Dashboard',
      type: 'dashboard',
      icon: <Home className="h-4 w-4" />,
      path: '/dashboard'
    });

    if (activeView === 'notebooks' || currentNotebookId || currentNoteId) {
      items.push({
        id: 'notebooks',
        name: 'Notebooks',
        type: 'notebooks',
        icon: <Book className="h-4 w-4" />,
        path: '/notebooks'
      });
    }

    // Add current notebook if exists
    if (currentNotebookId && files) {
      const notebook = files.find(f => f.id === currentNotebookId);
      if (notebook) {
        items.push({
          id: notebook.id,
          name: notebook.name || 'Notebook sem nome',
          type: 'notebook',
          icon: notebook.type === 'folder' ? <Folder className="h-4 w-4" /> : <Book className="h-4 w-4" />,
          path: `/notebooks/${notebook.id}`
        });
      }
    }

    // Add current note if exists
    if (currentNoteId && files) {
      const note = files.find(f => f.id === currentNoteId);
      if (note) {
        items.push({
          id: note.id,
          name: note.name || 'Nota sem título',
          type: 'note',
          icon: <FileText className="h-4 w-4" />,
          path: `/notebooks/${currentNotebookId || 'default'}/${note.id}`
        });
      }
    }

    return items;
  }, [activeView, currentNoteId, currentNotebookId, files]);

  const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
    // Prevent navigation to current item
    if (index === breadcrumbs.length - 1) return;

    switch (item.type) {
      case 'dashboard':
        onNavigate('dashboard', 'dashboard');
        break;
      case 'notebooks':
        onNavigate('notebooks', 'notebooks');
        break;
      case 'notebook':
        onNavigate('notebooks', 'notebook', item.id);
        break;
      case 'note':
        onNavigate('editor', 'note', item.id);
        break;
    }
  };

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for single item
  }

  return (
    <nav 
      className={cn(
        "flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/50",
        className
      )}
      aria-label="Breadcrumb navigation"
    >
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isClickable = !isLast;

          return (
            <React.Fragment key={item.id}>
              <button
                onClick={() => handleBreadcrumbClick(item, index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200",
                  isClickable
                    ? "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer hover:scale-105 active:scale-95"
                    : "text-slate-900 dark:text-slate-100 font-medium cursor-default",
                  "group relative overflow-hidden"
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {/* Hover background effect */}
                {isClickable && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                
                {/* Icon with animation */}
                <span className={cn(
                  "relative z-10 transition-all duration-200",
                  isClickable 
                    ? "group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110" 
                    : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {item.icon}
                </span>
                
                {/* Text */}
                <span className={cn(
                  "relative z-10 max-w-[150px] truncate transition-colors duration-200",
                  isLast && "font-semibold"
                )}>
                  {item.name}
                </span>

                {/* Special indicators */}
                {item.type === 'note' && (
                  <Star className="h-3 w-3 text-yellow-400 relative z-10" />
                )}
              </button>

              {/* Separator */}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0 animate-pulse" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Current context actions */}
        {activeView === 'notebooks' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
              {breadcrumbs.length - 1} níveis
            </span>
          </div>
        )}

        {/* Navigation hint */}
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border text-xs">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border text-xs">
            K
          </kbd>
          <span className="ml-1">para navegar</span>
        </div>
      </div>
    </nav>
  );
};

// Hook para gerenciar breadcrumbs
export const useBreadcrumbs = () => {
  const { getCurrentFile, files } = useFileSystemContext();

  const generateBreadcrumbPath = (fileId: string) => {
    if (!files) return [];
    
    const file = files.find(f => f.id === fileId);
    if (!file) return [];

    const path = [];
    let currentFile = file;

    // Build path from current file to root
    while (currentFile) {
      path.unshift({
        id: currentFile.id,
        name: currentFile.name,
        type: currentFile.type
      });

      if (currentFile.parentId) {
        currentFile = files.find(f => f.id === currentFile.parentId);
      } else {
        break;
      }
    }

    return path;
  };

  const getCurrentBreadcrumbs = () => {
    const currentFile = getCurrentFile();
    if (!currentFile) return [];
    
    return generateBreadcrumbPath(currentFile.id);
  };

  return {
    generateBreadcrumbPath,
    getCurrentBreadcrumbs
  };
}; 