
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Hash, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagWithCount } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface TagTreeItemProps {
  tag: TagWithCount;
  fullPath: string;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpansion: (path: string) => void;
  onSelect: (path: string) => void;
  searchQuery?: string;
}

export const TagTreeItem: React.FC<TagTreeItemProps> = ({
  tag,
  fullPath,
  level,
  isSelected,
  isExpanded,
  onToggleExpansion,
  onSelect,
  searchQuery = ''
}) => {
  const hasChildren = tag.children && tag.children.length > 0;
  const isParentTag = hasChildren;

  // Highlight search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {text.slice(index, index + query.length)}
        </mark>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer group hover:bg-notion-dark-hover transition-colors",
          isSelected && "bg-notion-purple text-white",
          `ml-${level * 3}`
        )}
        onClick={() => onSelect(fullPath)}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpansion(fullPath);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {!hasChildren && <div className="w-4" />}
        
        {isParentTag ? (
          isExpanded ? (
            <FolderOpen className="h-3 w-3 text-notion-blue" />
          ) : (
            <Folder className="h-3 w-3 text-notion-blue" />
          )
        ) : (
          <Hash className="h-3 w-3 text-gray-400" />
        )}
        
        <span className="truncate flex-1">
          {highlightMatch(tag.name, searchQuery)}
        </span>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>({tag.count})</span>
          {tag.files.length > 0 && (
            <div className="w-2 h-2 bg-notion-purple rounded-full opacity-60" />
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-2">
          {tag.children!.map(childTag => {
            const childPath = `${fullPath}/${childTag.name}`;
            return (
              <TagTreeItem
                key={childPath}
                tag={childTag}
                fullPath={childPath}
                level={level + 1}
                isSelected={false}
                isExpanded={false}
                onToggleExpansion={onToggleExpansion}
                onSelect={onSelect}
                searchQuery={searchQuery}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
