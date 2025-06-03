
import React, { useState } from 'react';
import { Tag, ChevronRight, ChevronDown, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagWithCount } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface TagsPanelProps {
  tags: TagWithCount[];
  selectedTags: string[];
  onTagSelect: (tagName: string) => void;
  onTagFilter: (tagNames: string[]) => void;
  className?: string;
}

export const TagsPanel: React.FC<TagsPanelProps> = ({
  tags,
  selectedTags,
  onTagSelect,
  onTagFilter,
  className
}) => {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTagExpansion = (tagPath: string) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagPath)) {
        newSet.delete(tagPath);
      } else {
        newSet.add(tagPath);
      }
      return newSet;
    });
  };

  const renderTagTree = (tagList: TagWithCount[], level = 0, parentPath = '') => {
    return tagList
      .filter(tag => searchQuery === '' || tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(tag => {
        const fullPath = parentPath ? `${parentPath}/${tag.name}` : tag.name;
        const hasChildren = tag.children && tag.children.length > 0;
        const isExpanded = expandedTags.has(fullPath);
        const isSelected = selectedTags.includes(fullPath);

        return (
          <div key={fullPath} className="select-none">
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1 text-sm rounded-md cursor-pointer group hover:bg-notion-dark-hover transition-colors",
                isSelected && "bg-notion-purple text-white",
                `ml-${level * 4}`
              )}
              onClick={() => onTagSelect(fullPath)}
            >
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTagExpansion(fullPath);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              <Hash className="h-3 w-3 text-gray-400" />
              <span className="truncate flex-1">{tag.name}</span>
              <span className="text-xs text-gray-400">({tag.count})</span>
            </div>

            {hasChildren && isExpanded && (
              <div className="ml-4">
                {renderTagTree(tag.children!, level + 1, fullPath)}
              </div>
            )}
          </div>
        );
      });
  };

  const clearAllFilters = () => {
    onTagFilter([]);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Tags</h3>
        </div>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs text-gray-400 hover:text-white"
          >
            Limpar
          </Button>
        )}
      </div>

      <div className="mb-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar tags..."
          className="h-8 text-sm bg-notion-dark-hover border-notion-dark-border"
        />
      </div>

      {selectedTags.length > 0 && (
        <div className="mb-3 space-y-1">
          <h4 className="text-xs font-medium text-gray-400">Filtros ativos:</h4>
          {selectedTags.map(tag => (
            <div key={tag} className="flex items-center gap-2 text-xs">
              <Hash className="h-3 w-3 text-notion-purple" />
              <span className="text-notion-purple">{tag}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-xs text-gray-500">Nenhuma tag encontrada</p>
        ) : (
          renderTagTree(tags)
        )}
      </div>
    </div>
  );
};
