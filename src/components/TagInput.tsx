
import type { KeyboardEvent } from 'react';
import React, { useState } from 'react';
import { X, Plus, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Adicionar tag...",
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue('');
    setIsInputVisible(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsInputVisible(false);
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {tags.map(tag => (
        <Badge
          key={tag}
          variant="secondary"
          className="bg-notion-purple/20 text-notion-purple border-notion-purple/30 hover:bg-notion-purple/30 transition-colors"
        >
          <Hash className="h-3 w-3 mr-1" />
          {tag}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { removeTag(tag); }}
            className="h-4 w-4 p-0 ml-1 hover:bg-notion-purple/40"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      {isInputVisible ? (
        <Input
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
            } else {
              setIsInputVisible(false);
            }
          }}
          placeholder={placeholder}
          className="h-6 w-32 text-xs"
          autoFocus
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setIsInputVisible(true); }}
          className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-notion-dark-hover"
        >
          <Plus className="h-3 w-3 mr-1" />
          Tag
        </Button>
      )}
    </div>
  );
};
