
import React from 'react';
import { Input } from '@/components/ui/input';
import type { Block } from '@/types';
import { cn } from '@/lib/utils';

interface HeadingBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus
}) => {
  const level = block.properties?.level || 1;
  
  const getHeadingClass = (level: number) => {
    switch (level) {
      case 1: return "text-3xl font-bold";
      case 2: return "text-2xl font-bold";
      case 3: return "text-xl font-semibold";
      default: return "text-lg font-medium";
    }
  };

  return (
    <Input
      value={block.content}
      onChange={(e) => { onUpdate({ content: e.target.value }); }}
      onFocus={onFocus}
      placeholder={`Título ${level}`}
      className={cn(
        "w-full bg-transparent border-none focus:ring-0 focus:outline-none text-gray-200",
        getHeadingClass(level),
        isSelected && "ring-1 ring-notion-purple"
      )}
    />
  );
};
