import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Hash, Plus, X, Palette, Star, TrendingUp, Clock, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';

interface TagInfo {
  name: string;
  count: number;
  color?: string;
  lastUsed: Date;
  popularity: 'low' | 'medium' | 'high';
  relatedTags: string[];
}

interface TagSystemProps {
  files: FileItem[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onTagSelect?: (tag: string) => void;
  mode?: 'input' | 'filter' | 'manager';
  placeholder?: string;
  className?: string;
}

const TAG_COLORS = [
  'bg-red-100 text-red-800 border-red-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-gray-100 text-gray-800 border-gray-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200'
];

export const TagSystem: React.FC<TagSystemProps> = ({
  files,
  selectedTags,
  onTagsChange,
  onTagSelect,
  mode = 'input',
  placeholder = 'Adicionar tags...',
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate tag information from files
  const tagInfo = useMemo(() => {
    const tagData: Record<string, TagInfo> = {};
    
    files.forEach(file => {
      file.tags?.forEach(tag => {
        if (!tagData[tag]) {
          tagData[tag] = {
            name: tag,
            count: 0,
            lastUsed: new Date(file.updatedAt),
            popularity: 'low',
            relatedTags: []
          };
        }
        
        tagData[tag].count++;
        const fileDate = new Date(file.updatedAt);
        if (fileDate > tagData[tag].lastUsed) {
          tagData[tag].lastUsed = fileDate;
        }
      });
    });

    // Calculate popularity and related tags
    const totalFiles = files.length;
    Object.values(tagData).forEach(tag => {
      const usage = tag.count / totalFiles;
      if (usage > 0.3) tag.popularity = 'high';
      else if (usage > 0.1) tag.popularity = 'medium';
      
      // Find related tags (tags that appear together frequently)
      const relatedCounts: Record<string, number> = {};
      files.forEach(file => {
        if (file.tags?.includes(tag.name)) {
          file.tags.forEach(otherTag => {
            if (otherTag !== tag.name) {
              relatedCounts[otherTag] = (relatedCounts[otherTag] || 0) + 1;
            }
          });
        }
      });
      
      tag.relatedTags = Object.entries(relatedCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tagName]) => tagName);
    });

    return tagData;
  }, [files]);

  // Get suggested tags based on current input and context
  const suggestedTags = useMemo(() => {
    const suggestions: Array<{ tag: string; reason: string; priority: number }> = [];
    
    Object.values(tagInfo).forEach(tag => {
      if (selectedTags.includes(tag.name)) return;
      
      const matchesInput = inputValue === '' || 
        tag.name.toLowerCase().includes(inputValue.toLowerCase());
      
      if (matchesInput) {
        let priority = 0;
        let reason = '';
        
        // Exact match gets highest priority
        if (tag.name.toLowerCase() === inputValue.toLowerCase()) {
          priority = 100;
          reason = 'Correspondência exata';
        }
        // Popular tags
        else if (tag.popularity === 'high') {
          priority = 80;
          reason = 'Tag popular';
        }
        // Recently used
        else if (tag.lastUsed > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
          priority = 70;
          reason = 'Usada recentemente';
        }
        // Related to selected tags
        else if (selectedTags.some(selectedTag => tag.relatedTags.includes(selectedTag))) {
          priority = 60;
          reason = 'Tag relacionada';
        }
        // Partial match
        else if (tag.name.toLowerCase().includes(inputValue.toLowerCase())) {
          priority = 40;
          reason = 'Correspondência parcial';
        }
        
        if (priority > 0) {
          suggestions.push({ tag: tag.name, reason, priority });
        }
      }
    });
    
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
  }, [inputValue, tagInfo, selectedTags]);

  // Handle tag addition
  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      const newTags = [...selectedTags, trimmedTag];
      onTagsChange(newTags);
      
      // Assign random color if new tag
      if (!tagInfo[trimmedTag] && !tagColors[trimmedTag]) {
        const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
        setTagColors(prev => ({ ...prev, [trimmedTag]: randomColor }));
      }
    }
    setInputValue('');
    setIsOpen(false);
  };

  // Handle tag removal
  const removeTag = (tagName: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagName);
    onTagsChange(newTags);
  };

  // Handle input key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Get tag color
  const getTagColor = (tagName: string) => {
    if (tagColors[tagName]) return tagColors[tagName];
    if (tagInfo[tagName]?.color) return tagInfo[tagName].color;
    
    // Assign color based on tag characteristics
    const info = tagInfo[tagName];
    if (info) {
      if (info.popularity === 'high') return TAG_COLORS[0]; // Red for popular
      if (info.lastUsed > new Date(Date.now() - 24 * 60 * 60 * 1000)) return TAG_COLORS[1]; // Blue for recent
    }
    
    return TAG_COLORS[7]; // Gray as default
  };

  // Get popularity icon
  const getPopularityIcon = (popularity: string) => {
    switch (popularity) {
      case 'high': return <TrendingUp className="h-2 w-2 text-red-500" />;
      case 'medium': return <Star className="h-2 w-2 text-yellow-500" />;
      default: return <Clock className="h-2 w-2 text-gray-400" />;
    }
  };

  if (mode === 'manager') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Gerenciar Tags</h3>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar tags..."
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); }}
              className="w-48"
            />
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(tagInfo)
            .filter(tag => !inputValue || tag.name.toLowerCase().includes(inputValue.toLowerCase()))
            .sort((a, b) => b.count - a.count)
            .map(tag => (
              <div
                key={tag.name}
                className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge className={getTagColor(tag.name)}>
                    #{tag.name}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getPopularityIcon(tag.popularity)}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Palette className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2">
                        <div className="grid grid-cols-5 gap-1">
                          {TAG_COLORS.map((color, index) => (
                            <button
                              key={index}
                              className={cn("w-6 h-6 rounded border-2", color)}
                              onClick={() => {
                                setTagColors(prev => ({ ...prev, [tag.name]: color }));
                              }}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <div>Usado em {tag.count} {tag.count === 1 ? 'arquivo' : 'arquivos'}</div>
                  <div>Última vez: {tag.lastUsed.toLocaleDateString('pt-BR')}</div>
                  <div>Popularidade: {tag.popularity === 'high' ? 'Alta' : tag.popularity === 'medium' ? 'Média' : 'Baixa'}</div>
                </div>
                
                {tag.relatedTags.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Tags relacionadas:</div>
                    <div className="flex flex-wrap gap-1">
                      {tag.relatedTags.map(relatedTag => (
                        <Badge key={relatedTag} variant="outline" className="text-xs">
                          {relatedTag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag}
              className={cn("cursor-pointer", getTagColor(tag))}
              onClick={() => onTagSelect?.(tag)}
            >
              <Hash className="h-2 w-2 mr-1" />
              {tag}
              <X
                className="h-2 w-2 ml-1 hover:bg-black/10 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
              />
            </Badge>
          ))}
        </div>
      )}
      
      {/* Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => { setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-10"
        />
        <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (suggestedTags.length > 0 || inputValue.trim()) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {inputValue.trim() && !tagInfo[inputValue.trim()] && (
            <button
              className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b border-slate-100 dark:border-slate-600"
              onClick={() => { addTag(inputValue); }}
            >
              <Plus className="h-3 w-3 text-green-500" />
              <span className="text-sm">Criar nova tag "{inputValue.trim()}"</span>
            </button>
          )}
          
          {suggestedTags.map(({ tag, reason }) => {
            const info = tagInfo[tag];
            return (
              <button
                key={tag}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                onClick={() => { addTag(tag); }}
              >
                <div className="flex items-center gap-2">
                  <Badge className={getTagColor(tag)} variant="outline">
                    #{tag}
                  </Badge>
                  {info && (
                    <div className="flex items-center gap-1">
                      {getPopularityIcon(info.popularity)}
                      <span className="text-xs text-slate-500">
                        {info.count}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-400">{reason}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}; 