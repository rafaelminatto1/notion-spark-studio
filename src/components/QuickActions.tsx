
import React from 'react';
import { FileText, FolderPlus, Search, Settings, Star, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

interface QuickActionsProps {
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onToggleSearch: () => void;
  onOpenSettings: () => void;
  onToggleFavorites: () => void;
  onShowRecent: () => void;
  onDeleteSelected?: () => void;
  hasSelection?: boolean;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateFile,
  onCreateFolder,
  onToggleSearch,
  onOpenSettings,
  onToggleFavorites,
  onShowRecent,
  onDeleteSelected,
  hasSelection = false,
  className
}) => {
  const actions: QuickAction[] = [
    {
      id: 'new-file',
      label: 'Nova Nota',
      icon: <FileText className="h-4 w-4" />,
      shortcut: 'Ctrl+N',
      action: onCreateFile
    },
    {
      id: 'new-folder',
      label: 'Nova Pasta',
      icon: <FolderPlus className="h-4 w-4" />,
      shortcut: 'Ctrl+Shift+F',
      action: onCreateFolder
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: <Search className="h-4 w-4" />,
      shortcut: 'Ctrl+K',
      action: onToggleSearch
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: <Star className="h-4 w-4" />,
      action: onToggleFavorites
    },
    {
      id: 'recent',
      label: 'Recentes',
      icon: <Clock className="h-4 w-4" />,
      action: onShowRecent
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="h-4 w-4" />,
      action: onOpenSettings
    }
  ];

  if (hasSelection && onDeleteSelected) {
    actions.push({
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      shortcut: 'Del',
      action: onDeleteSelected,
      variant: 'destructive'
    });
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map(action => (
        <Button
          key={action.id}
          variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
          size="sm"
          onClick={action.action}
          className="h-9 gap-2 hover:scale-105 transition-transform"
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
          {action.shortcut && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {action.shortcut}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};
