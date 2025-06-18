
import React, { useState, useMemo } from 'react';
import { Tag, Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TagWithCount } from '@/hooks/useTags';
import { TagTreeItem } from '@/components/TagTreeItem';
import { TagStats } from '@/components/TagStats';
import { cn } from '@/lib/utils';

interface TagsPanelProps {
  tags: TagWithCount[];
  selectedTags: string[];
  onTagSelect: (tagName: string) => void;
  onTagFilter: (tagNames: string[]) => void;
  className?: string;
}

type SortOption = 'name' | 'count' | 'alphabetical';

export const TagsPanel: React.FC<TagsPanelProps> = ({
  tags,
  selectedTags,
  onTagSelect,
  onTagFilter,
  className
}) => {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('count');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

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

  const filteredAndSortedTags = useMemo(() => {
    let filtered = [...tags];

    // Filter by search query
    if (searchQuery) {
      const filterBySearch = (tagList: TagWithCount[]): TagWithCount[] => {
        return tagList.filter(tag => {
          const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase());
          const hasMatchingChildren = tag.children ? 
            filterBySearch(tag.children).length > 0 : false;
          
          if (matchesSearch || hasMatchingChildren) {
            return {
              ...tag,
              children: tag.children ? filterBySearch(tag.children) : undefined
            };
          }
          return false;
        }).map(tag => ({
          ...tag,
          children: tag.children ? filterBySearch(tag.children) : undefined
        }));
      };
      filtered = filterBySearch(filtered);
    }

    // Filter by selected tags only
    if (showOnlySelected && selectedTags.length > 0) {
      const filterBySelected = (tagList: TagWithCount[], parentPath = ''): TagWithCount[] => {
        return tagList.filter(tag => {
          const fullPath = parentPath ? `${parentPath}/${tag.name}` : tag.name;
          const isSelected = selectedTags.includes(fullPath);
          const hasSelectedChildren = tag.children ? 
            filterBySelected(tag.children, fullPath).length > 0 : false;
          
          return isSelected || hasSelectedChildren;
        }).map(tag => ({
          ...tag,
          children: tag.children ? filterBySelected(tag.children, parentPath ? `${parentPath}/${tag.name}` : tag.name) : undefined
        }));
      };
      filtered = filterBySelected(filtered);
    }

    // Sort tags
    const sortTags = (tagList: TagWithCount[]): TagWithCount[] => {
      return tagList.sort((a, b) => {
        switch (sortBy) {
          case 'name':
          case 'alphabetical':
            return a.name.localeCompare(b.name);
          case 'count':
            return b.count - a.count;
          default:
            return 0;
        }
      }).map(tag => ({
        ...tag,
        children: tag.children ? sortTags(tag.children) : undefined
      }));
    };

    return sortTags(filtered);
  }, [tags, searchQuery, sortBy, showOnlySelected, selectedTags]);

  const clearAllFilters = () => {
    onTagFilter([]);
    setSearchQuery('');
    setShowOnlySelected(false);
  };

  const expandAll = () => {
    const getAllPaths = (tagList: TagWithCount[], parentPath = ''): string[] => {
      let paths: string[] = [];
      tagList.forEach(tag => {
        const fullPath = parentPath ? `${parentPath}/${tag.name}` : tag.name;
        if (tag.children && tag.children.length > 0) {
          paths.push(fullPath);
          paths = paths.concat(getAllPaths(tag.children, fullPath));
        }
      });
      return paths;
    };
    
    setExpandedTags(new Set(getAllPaths(tags)));
  };

  const collapseAll = () => {
    setExpandedTags(new Set());
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Tags</h3>
        </div>
        
        <div className="flex items-center gap-1">
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 text-xs text-gray-400 hover:text-white"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
            placeholder="Buscar tags..."
            className="h-8 text-sm bg-notion-dark-hover border-notion-dark-border pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: SortOption) => { setSortBy(value); }}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Por uso</SelectItem>
              <SelectItem value="alphabetical">Alfabética</SelectItem>
              <SelectItem value="name">Por nome</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowOnlySelected(!showOnlySelected); }}
            className={cn(
              "h-7 text-xs",
              showOnlySelected && "bg-notion-purple text-white"
            )}
          >
            <Filter className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="h-6 text-xs text-gray-400 hover:text-white flex-1"
          >
            Expandir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="h-6 text-xs text-gray-400 hover:text-white flex-1"
          >
            Recolher
          </Button>
        </div>
      </div>

      {/* Stats */}
      <TagStats 
        tags={tags} 
        selectedTags={selectedTags} 
        className="mb-3" 
      />

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="mb-3 p-2 bg-notion-dark-hover rounded-md">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Filtros ativos:</h4>
          <div className="space-y-1">
            {selectedTags.map(tag => (
              <div key={tag} className="flex items-center justify-between text-xs">
                <span className="text-notion-purple">{tag}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onTagSelect(tag); }}
                  className="h-4 w-4 p-0 text-gray-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag Tree */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredAndSortedTags.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            {searchQuery ? 'Nenhuma tag encontrada' : 'Nenhuma tag disponível'}
          </p>
        ) : (
          filteredAndSortedTags.map(tag => (
            <TagTreeItem
              key={tag.name}
              tag={tag}
              fullPath={tag.name}
              level={0}
              isSelected={selectedTags.includes(tag.name)}
              isExpanded={expandedTags.has(tag.name)}
              onToggleExpansion={toggleTagExpansion}
              onSelect={onTagSelect}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </div>
  );
};
