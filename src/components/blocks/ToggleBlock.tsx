
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Block } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface ToggleBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
  children?: React.ReactNode;
}

export const ToggleBlock: React.FC<ToggleBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(block.properties?.expanded || false);

  const toggleExpanded = () => {
    const expanded = !isExpanded;
    setIsExpanded(expanded);
    onUpdate({ properties: { ...block.properties, expanded } });
  };

  return (
    <div className={cn(isSelected && "ring-1 ring-notion-purple rounded")}>
      <div className="flex items-start gap-2">
        <button
          onClick={toggleExpanded}
          className="mt-1 p-1 hover:bg-gray-700 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <Textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          onFocus={onFocus}
          placeholder="Toggle..."
          className="flex-1 bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-foreground min-h-[2rem]"
          rows={1}
        />
      </div>
      {isExpanded && children && (
        <div className="ml-6 mt-2 border-l-2 border-gray-600 pl-4">
          {children}
        </div>
      )}
    </div>
  );
};
