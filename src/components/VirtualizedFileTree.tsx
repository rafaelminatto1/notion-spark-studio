import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, File, Folder, Database, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMicroInteractions, SmartSkeleton } from '@/components/ui/MicroInteractions';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';

interface VirtualizedFileTreeProps {
  files: FileItem[];
  currentFileId: string | null;
  expandedFolders: Set<string>;
  onFileSelect: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  className?: string;
  isLoading?: boolean;
  searchQuery?: string;
}

interface FlatFileItem extends FileItem {
  level: number;
  index: number;
  isVisible: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  collaborators?: string[];
}

const ITEM_HEIGHT = 40;
const OVERSCAN_COUNT = 10;

const IconMap = {
  file: File,
  folder: Folder,
  database: Database,
} as const;

const TreeItem = memo<{
  item: FlatFileItem;
  style: React.CSSProperties;
  isSelected: boolean;
  isHovered: boolean;
  searchQuery: string;
  onSelect: (fileId: string) => void;
  onToggle: (folderId: string) => void;
  onHover: (fileId: string | null) => void;
}>(({ item, style, isSelected, isHovered, searchQuery, onSelect, onToggle, onHover }) => {
  const Icon = IconMap[item.type as keyof typeof IconMap] || File;
  const indentWidth = item.level * 20;
  const { triggerInteractionFeedback } = useMicroInteractions();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Trigger haptic feedback
    triggerInteractionFeedback('click');
    
    if (item.type === 'folder') {
      onToggle(item.id);
    } else {
      onSelect(item.id);
    }
  }, [item.id, item.type, onSelect, onToggle, triggerInteractionFeedback]);

  const handleMouseEnter = useCallback(() => {
    onHover(item.id);
    triggerInteractionFeedback('hover');
  }, [item.id, onHover, triggerInteractionFeedback]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  // Highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => (
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-400 text-black px-0.5 rounded">
          {part}
        </mark>
      ) : part
    ));
  };

  return (
    <motion.div
      style={style}
      className={cn(
        "flex items-center cursor-pointer group transition-all duration-200",
        "hover:bg-slate-700/50",
        isSelected && "bg-blue-600/20 border-r-2 border-blue-400",
        isHovered && "bg-slate-600/30"
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div style={{ width: indentWidth }} />
      
      {item.type === 'folder' && (
        <button
          className="p-1 hover:bg-slate-600 rounded transition-colors mr-1"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.id);
          }}
        >
          {item.isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>
      )}
      
      <div className="flex-shrink-0 mr-2">
        <Icon className={cn(
          "h-4 w-4",
          item.type === 'folder' ? "text-yellow-400" :
          item.type === 'database' ? "text-green-400" :
          "text-blue-400"
        )} />
      </div>
      
      <span className={cn(
        "flex-1 truncate text-sm",
        isSelected ? "text-white font-medium" : "text-slate-300"
      )}>
        {highlightText(item.name, searchQuery)}
      </span>
      
      <div className="flex-shrink-0 flex items-center space-x-1 mr-2">
        {item.collaborators && item.collaborators.length > 0 && (
          <div className="w-2 h-2 bg-green-400 rounded-full" />
        )}
        
        {item.updatedAt && new Date().getTime() - new Date(item.updatedAt).getTime() < 24 * 60 * 60 * 1000 && (
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        )}
        
        {item.tags && item.tags.length > 0 && (
          <div className="flex space-x-1">
            {item.tags.slice(0, 2).map((tag, i) => (
              <div
                key={i}
                className="px-1 py-0.5 text-xs bg-slate-600 text-slate-300 rounded"
              >
                {tag}
              </div>
            ))}
            {item.tags.length > 2 && (
              <div className="px-1 py-0.5 text-xs bg-slate-600 text-slate-300 rounded">
                +{item.tags.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

TreeItem.displayName = 'TreeItem';

export const VirtualizedFileTree: React.FC<VirtualizedFileTreeProps> = memo(({
  files,
  currentFileId,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
  className,
  isLoading = false,
  searchQuery: externalSearchQuery = ''
}) => {
  const listRef = useRef<any>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  // Micro-interactions
  const { triggerInteractionFeedback } = useMicroInteractions();
  
  // Search interno
  const {
    query: internalSearchQuery,
    setQuery,
    debouncedQuery
  } = useDebounceSearch('', {
    delay: 200,
    minQueryLength: 1
  });
  
  // Usar busca externa se fornecida, senão usar interna
  const activeSearchQuery = externalSearchQuery || debouncedQuery;

  const flatItems = useMemo(() => {
    const buildFlatTree = (items: FileItem[], level = 0, parentExpanded = true): FlatFileItem[] => {
      const result: FlatFileItem[] = [];
      
      const sortedItems = [...items].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
      
      sortedItems.forEach((item, index) => {
        const isExpanded = expandedFolders.has(item.id);
        const hasChildren = files.some(f => f.parentId === item.id);
        
        const flatItem: FlatFileItem = {
          ...item,
          level,
          index,
          isVisible: parentExpanded,
          hasChildren,
          isExpanded
        };
        
        result.push(flatItem);
        
        if (isExpanded && hasChildren) {
          const children = files.filter(f => f.parentId === item.id);
          result.push(...buildFlatTree(children, level + 1, parentExpanded && isExpanded));
        }
      });
      
      return result;
    };
    
    const rootItems = files.filter(f => !f.parentId);
    return buildFlatTree(rootItems);
  }, [files, expandedFolders]);

  const visibleItems = useMemo(() => {
    return flatItems.filter(item => item.isVisible);
  }, [flatItems]);

  useEffect(() => {
    if (currentFileId && listRef.current) {
      const selectedIndex = visibleItems.findIndex(item => item.id === currentFileId);
      if (selectedIndex >= 0) {
        listRef.current.scrollToItem(selectedIndex, 'smart');
      }
    }
  }, [currentFileId, visibleItems]);

  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = visibleItems[index];
    if (!item) return null;

    return (
      <TreeItem
        key={item.id}
        item={item}
        style={style}
        isSelected={item.id === currentFileId}
        isHovered={item.id === hoveredItemId}
        searchQuery={activeSearchQuery}
        onSelect={onFileSelect}
        onToggle={onToggleFolder}
        onHover={setHoveredItemId}
      />
    );
  }, [visibleItems, currentFileId, hoveredItemId, activeSearchQuery, onFileSelect, onToggleFolder]);

  if (visibleItems.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-slate-400", className)}>
        <div className="text-center">
          <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum arquivo encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full", className)}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={visibleItems.length}
            itemSize={ITEM_HEIGHT}
            overscanCount={OVERSCAN_COUNT}
          >
            {renderItem}
          </List>
        )}
      </AutoSizer>
      
      {visibleItems.length > 1000 && (
        <motion.div
          className="absolute bottom-4 right-4 bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          📊 {visibleItems.length.toLocaleString()} itens
        </motion.div>
      )}
    </div>
  );
});

VirtualizedFileTree.displayName = 'VirtualizedFileTree'; 