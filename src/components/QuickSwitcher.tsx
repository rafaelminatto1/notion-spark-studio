
import React, { useState } from 'react';
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { FileText, GitBranch, Plus, Search } from 'lucide-react';
import { QuickSwitcherCommand } from '@/hooks/useQuickSwitcher';

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  commands: QuickSwitcherCommand[];
  query: string;
  onQueryChange: (query: string) => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'FileText':
      return FileText;
    case 'GitBranch':
      return GitBranch;
    case 'Plus':
      return Plus;
    default:
      return FileText;
  }
};

export const QuickSwitcher: React.FC<QuickSwitcherProps> = ({
  isOpen,
  onClose,
  commands,
  query,
  onQueryChange
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groupedCommands = {
    files: commands.filter(cmd => cmd.category === 'file'),
    commands: commands.filter(cmd => cmd.category === 'command'),
    create: commands.filter(cmd => cmd.category === 'create')
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalCommands = commands.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalCommands);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalCommands) % totalCommands);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (commands[selectedIndex]) {
        commands[selectedIndex].action();
      }
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <div onKeyDown={handleKeyDown}>
        <CommandInput
          placeholder="Buscar arquivos, comandos... (Digite + para criar)"
          value={query}
          onValueChange={onQueryChange}
          className="border-0 focus:ring-0"
        />
        
        <CommandList className="max-h-96">
          <CommandEmpty className="py-6 text-center text-sm text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8 text-gray-400" />
              <p>Nenhum resultado encontrado</p>
              <p className="text-xs">Digite + seguido do nome para criar um novo arquivo</p>
            </div>
          </CommandEmpty>

          {groupedCommands.files.length > 0 && (
            <CommandGroup heading="Arquivos">
              {groupedCommands.files.map((command, index) => {
                const Icon = getIcon(command.icon || 'FileText');
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => command.action()}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-gray-500 truncate">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {groupedCommands.commands.length > 0 && (
            <CommandGroup heading="Comandos">
              {groupedCommands.commands.map((command) => {
                const Icon = getIcon(command.icon || 'FileText');
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => command.action()}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-notion-purple" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-gray-500">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {groupedCommands.create.length > 0 && (
            <CommandGroup heading="Criar">
              {groupedCommands.create.map((command) => {
                const Icon = getIcon(command.icon || 'Plus');
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => command.action()}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-gray-500">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  );
};
