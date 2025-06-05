
import React, { useEffect } from 'react';
import { 
  Search, 
  FileText, 
  FolderPlus, 
  Hash, 
  Settings, 
  Palette,
  Clock,
  Star
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { FileItem } from '@/types';
import { format } from 'date-fns';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  files: FileItem[];
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (fileId: string) => void;
  onCreateFile: (name: string) => void;
  favorites: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  files,
  isOpen,
  onClose,
  onFileSelect,
  onCreateFile,
  favorites
}) => {
  const recentFiles = files
    .filter(f => f.type === 'file')
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const favoriteFiles = files.filter(f => favorites.includes(f.id));

  const commands: Command[] = [
    // Recent files
    ...recentFiles.map(file => ({
      id: `file-${file.id}`,
      title: file.name,
      subtitle: `Atualizado ${format(file.updatedAt, 'dd/MM/yyyy')}`,
      icon: file.emoji ? <span>{file.emoji}</span> : <FileText className="h-4 w-4" />,
      action: () => {
        onFileSelect(file.id);
        onClose();
      },
      group: 'recent',
      keywords: [file.name, ...(file.tags || []), file.content || ''].filter(Boolean)
    })),

    // Favorite files
    ...favoriteFiles.map(file => ({
      id: `favorite-${file.id}`,
      title: file.name,
      subtitle: 'Favorito',
      icon: <Star className="h-4 w-4 text-yellow-500" />,
      action: () => {
        onFileSelect(file.id);
        onClose();
      },
      group: 'favorites',
      keywords: [file.name, ...(file.tags || [])].filter(Boolean)
    })),

    // All files
    ...files
      .filter(f => f.type === 'file' && !recentFiles.includes(f) && !favoriteFiles.includes(f))
      .map(file => ({
        id: `all-${file.id}`,
        title: file.name,
        subtitle: file.tags?.slice(0, 2).join(', ') || 'Sem tags',
        icon: file.emoji ? <span>{file.emoji}</span> : <FileText className="h-4 w-4" />,
        action: () => {
          onFileSelect(file.id);
          onClose();
        },
        group: 'files',
        keywords: [file.name, ...(file.tags || []), file.content || ''].filter(Boolean)
      })),

    // Actions
    {
      id: 'create-file',
      title: 'Nova Página',
      subtitle: 'Criar uma nova página',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        const name = prompt('Nome da nova página:');
        if (name) {
          onCreateFile(name);
        }
        onClose();
      },
      group: 'actions',
      keywords: ['nova', 'criar', 'página', 'arquivo']
    },
    {
      id: 'create-folder',
      title: 'Nova Pasta',
      subtitle: 'Criar uma nova pasta',
      icon: <FolderPlus className="h-4 w-4" />,
      action: () => {
        const name = prompt('Nome da nova pasta:');
        if (name) {
          // onCreateFolder(name); // Você pode implementar isso
        }
        onClose();
      },
      group: 'actions',
      keywords: ['nova', 'criar', 'pasta', 'diretório']
    },
    {
      id: 'search-tags',
      title: 'Buscar por Tags',
      subtitle: 'Abrir painel de tags',
      icon: <Hash className="h-4 w-4" />,
      action: () => {
        // Implementar abertura do painel de tags
        onClose();
      },
      group: 'actions',
      keywords: ['tags', 'buscar', 'filtrar']
    },
    {
      id: 'settings',
      title: 'Configurações',
      subtitle: 'Abrir configurações',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        // Implementar abertura das configurações
        onClose();
      },
      group: 'actions',
      keywords: ['configurações', 'settings', 'preferências']
    },
    {
      id: 'theme',
      title: 'Alternar Tema',
      subtitle: 'Mudar entre claro e escuro',
      icon: <Palette className="h-4 w-4" />,
      action: () => {
        // Implementar troca de tema
        onClose();
      },
      group: 'actions',
      keywords: ['tema', 'escuro', 'claro', 'aparência']
    }
  ];

  const groupedCommands = {
    favorites: commands.filter(cmd => cmd.group === 'favorites'),
    recent: commands.filter(cmd => cmd.group === 'recent'),
    actions: commands.filter(cmd => cmd.group === 'actions'),
    files: commands.filter(cmd => cmd.group === 'files')
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="Digite um comando ou busque páginas..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        {groupedCommands.favorites.length > 0 && (
          <CommandGroup heading="Favoritos">
            {groupedCommands.favorites.map((command) => (
              <CommandItem key={command.id} onSelect={command.action}>
                <div className="flex items-center gap-2 w-full">
                  {command.icon}
                  <div className="flex-1">
                    <div className="font-medium">{command.title}</div>
                    {command.subtitle && (
                      <div className="text-xs text-muted-foreground">{command.subtitle}</div>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groupedCommands.recent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recentes">
              {groupedCommands.recent.map((command) => (
                <CommandItem key={command.id} onSelect={command.action}>
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {command.icon}
                    <div className="flex-1">
                      <div className="font-medium">{command.title}</div>
                      {command.subtitle && (
                        <div className="text-xs text-muted-foreground">{command.subtitle}</div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Ações">
          {groupedCommands.actions.map((command) => (
            <CommandItem key={command.id} onSelect={command.action}>
              <div className="flex items-center gap-2 w-full">
                {command.icon}
                <div className="flex-1">
                  <div className="font-medium">{command.title}</div>
                  {command.subtitle && (
                    <div className="text-xs text-muted-foreground">{command.subtitle}</div>
                  )}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {groupedCommands.files.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Todas as Páginas">
              {groupedCommands.files.slice(0, 10).map((command) => (
                <CommandItem key={command.id} onSelect={command.action}>
                  <div className="flex items-center gap-2 w-full">
                    {command.icon}
                    <div className="flex-1">
                      <div className="font-medium">{command.title}</div>
                      {command.subtitle && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-2 w-2" />
                          {command.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
              {groupedCommands.files.length > 10 && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  +{groupedCommands.files.length - 10} páginas mais...
                </div>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
