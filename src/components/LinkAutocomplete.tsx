
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import type { LinkSuggestion } from '@/hooks/useLinkAutocomplete';
import { cn } from '@/lib/utils';

interface LinkAutocompleteProps {
  isOpen: boolean;
  suggestions: LinkSuggestion[];
  position: { x: number; y: number };
  selectedIndex: number;
  onSelect: (suggestion: LinkSuggestion) => void;
  onClose: () => void;
  className?: string;
}

export const LinkAutocomplete: React.FC<LinkAutocompleteProps> = ({
  isOpen,
  suggestions,
  position,
  selectedIndex,
  onSelect,
  onClose,
  className
}) => {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-50 bg-notion-dark-hover border border-notion-dark-border rounded-lg shadow-lg p-2 min-w-64 max-w-80",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y + 20}px`
      }}
    >
      <div className="space-y-1">
        {suggestions.map((suggestion, index) => (
          <Button
            key={suggestion.id}
            variant="ghost"
            size="sm"
            onClick={() => { onSelect(suggestion); }}
            className={cn(
              "w-full justify-start gap-2 h-auto p-2",
              index === selectedIndex && "bg-notion-purple text-white"
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {suggestion.exists ? (
                <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
              ) : (
                <Plus className="h-4 w-4 text-green-400 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-left">
                <div className={cn(
                  "text-sm font-medium truncate",
                  suggestion.exists ? "text-gray-200" : "text-green-400"
                )}>
                  {suggestion.name}
                  {!suggestion.exists && " (criar)"}
                </div>
                {suggestion.content && (
                  <div className="text-xs text-gray-400 truncate mt-1">
                    {suggestion.content}...
                  </div>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 mt-2 px-2 py-1 border-t border-notion-dark-border">
        Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
      </div>
    </div>
  );
};
