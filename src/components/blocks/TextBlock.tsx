
import React, { useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [block.content]);

  return (
    <Textarea
      ref={textareaRef}
      value={block.content}
      onChange={(e) => {
        onUpdate({ content: e.target.value });
        adjustHeight();
      }}
      onFocus={onFocus}
      placeholder="Digite algo..."
      className={cn(
        "w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-gray-200 min-h-[120px] overflow-hidden",
        isSelected && "ring-1 ring-notion-purple"
      )}
      rows={1}
      style={{ height: 'auto' }}
    />
  );
};
