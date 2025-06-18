
import React, { useState, useEffect } from 'react';
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { FileText, GitBranch, Plus, Search, Clock, Zap } from 'lucide-react';
import type { QuickSwitcherCommand } from '@/hooks/useQuickSwitcher';
import { cn } from '@/lib/utils';

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
    case 'Clock':
      return Clock;
    default:
      return FileText;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'recent':
      return Clock;
    case 'command':
      return Zap;
    case 'create':
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

  // Reset selected index when commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [commands]);

  const groupedCommands = {
    recent: commands.filter(cmd => cmd.category === 'recent'),
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
      <div onKeyDown={handleKeyDown} className="overflow-hidden">
        <CommandInput
          placeholder="Search files, create notes... (Ctrl+K or Ctrl+P)"
          value={query}
          onValueChange={onQueryChange}
          className="border-0 focus:ring-0 text-sm"
        />
        
        <CommandList className="max-h-96 overflow-y-auto">
          <CommandEmpty className="py-8 text-center text-sm text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <Search className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium">No results found</p>
                <p className="text-xs mt-1">
                  {query ? `Try a different search term` : 'Start typing to search files and commands'}
                </p>
              </div>
            </div>
          </CommandEmpty>

          {groupedCommands.recent.length > 0 && (
            <CommandGroup heading="Recent Files">
              {groupedCommands.recent.map((command, index) => {
                const Icon = getIcon(command.icon || 'FileText');
                const isSelected = index === selectedIndex;
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => { command.action(); }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Clock className="h-4 w-4 text-orange-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {groupedCommands.files.length > 0 && (
            <CommandGroup heading="Files">
              {groupedCommands.files.map((command, index) => {
                const Icon = getIcon(command.icon || 'FileText');
                const adjustedIndex = index + groupedCommands.recent.length;
                const isSelected = adjustedIndex === selectedIndex;
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => { command.action(); }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{command.label}</div>
                      {command.description && command.description !== 'No tags' && (
                        <div className="text-xs text-muted-foreground truncate">
                          {command.description}
                        </div>
                      )}
                    </div>
                    {command.score && command.score > 80 && (
                      <div className="text-xs text-green-500 font-medium">
                        {Math.round(command.score)}%
                      </div>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {groupedCommands.commands.length > 0 && (
            <CommandGroup heading="Commands">
              {groupedCommands.commands.map((command, index) => {
                const Icon = getIcon(command.icon || 'Zap');
                const adjustedIndex = index + groupedCommands.recent.length + groupedCommands.files.length;
                const isSelected = adjustedIndex === selectedIndex;
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => { command.action(); }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 text-purple-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-muted-foreground">
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
            <CommandGroup heading="Create">
              {groupedCommands.create.map((command, index) => {
                const Icon = getIcon(command.icon || 'Plus');
                const adjustedIndex = index + groupedCommands.recent.length + groupedCommands.files.length + groupedCommands.commands.length;
                const isSelected = adjustedIndex === selectedIndex;
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => { command.action(); }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 text-green-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-muted-foreground">
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
        
        {/* Keyboard hints */}
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span><kbd className="bg-muted px-1 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="bg-muted px-1 rounded">Enter</kbd> Select</span>
            <span><kbd className="bg-muted px-1 rounded">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
};
