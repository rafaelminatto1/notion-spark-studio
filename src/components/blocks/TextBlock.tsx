
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Block } from '@/types';
import { cn } from '@/lib/utils';

interface TextBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus
}) => {
  return (
    <Textarea
      value={block.content}
      onChange={(e) => onUpdate({ content: e.target.value })}
      onFocus={onFocus}
      placeholder="Digite algo..."
      className={cn(
        "w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-gray-200 min-h-[2rem] overflow-hidden",
        isSelected && "ring-1 ring-notion-purple"
      )}
      rows={1}
      style={{ height: 'auto' }}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
      }}
    />
  );
};
