import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight,
  FileText,
  Folder,
  Search,
  Filter,
  Grid,
  List,
  Zap,
  BarChart,
  Clock,
  Database,
  TrendingUp,
  Eye,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para virtualização
interface VirtualizedItem {
  id: string;
  type: 'note' | 'folder' | 'separator' | 'header';
  title: string;
  subtitle?: string;
  content?: string;
  metadata?: {
    size?: number;
    modifiedAt?: Date;
    createdAt?: Date;
    author?: string;
    tags?: string[];
  };
  children?: VirtualizedItem[];
  level: number;
  isExpanded?: boolean;
  isVisible?: boolean;
  height?: number;
}

interface VirtualizedListProps {
  items: VirtualizedItem[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  onItemClick?: (item: VirtualizedItem) => void;
  onItemExpand?: (itemId: string, expanded: boolean) => void;
  renderItem?: (item: VirtualizedItem, index: number) => React.ReactNode;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableGrouping?: boolean;
  className?: string;
}

interface VirtualScrollState {
  scrollTop: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
}

// Hook para virtualização
const useVirtualization = (
  items: VirtualizedItem[],
  itemHeight: number = 60,
  containerHeight: number = 400,
  overscan: number = 5
) => {
  const [scrollState, setScrollState] = useState<VirtualScrollState>({
    scrollTop: 0,
    visibleStartIndex: 0,
    visibleEndIndex: 0,
    totalHeight: 0
  });

  // Flatten hierarchical items for virtualization
  const flattenedItems = useMemo(() => {
    const flatten = (items: VirtualizedItem[], level: number = 0): VirtualizedItem[] => {
      const result: VirtualizedItem[] = [];
      
      items.forEach((item, index) => {
        const flatItem = { ...item, level };
        result.push(flatItem);
        
        if (item.children && item.isExpanded) {
          result.push(...flatten(item.children, level + 1));
        }
      });
      
      return result;
    };
    
    return flatten(items);
  }, [items]);

  // Calculate visible items based on scroll position
  const visibleItems = useMemo(() => {
    const totalItems = flattenedItems.length;
    const visibleHeight = containerHeight;
    
    const startIndex = Math.max(
      0, 
      Math.floor(scrollState.scrollTop / itemHeight) - overscan
    );
    
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + Math.ceil(visibleHeight / itemHeight) + overscan * 2
    );

    const totalHeight = totalItems * itemHeight;
    
    setScrollState(prev => ({
      ...prev,
      visibleStartIndex: startIndex,
      visibleEndIndex: endIndex,
      totalHeight
    }));

    return flattenedItems.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index,
      offsetTop: (startIndex + index) * itemHeight
    }));
  }, [flattenedItems, scrollState.scrollTop, itemHeight, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollState(prev => ({ ...prev, scrollTop }));
  }, []);

  return {
    visibleItems,
    totalHeight: scrollState.totalHeight,
    handleScroll,
    scrollState
  };
};

// Hook para pesquisa e filtros
const useListFiltering = (items: VirtualizedItem[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query) ||
        item.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filters
    if (activeFilters.size > 0) {
      result = result.filter(item => activeFilters.has(item.type));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          const dateA = a.metadata?.modifiedAt || a.metadata?.createdAt || new Date(0);
          const dateB = b.metadata?.modifiedAt || b.metadata?.createdAt || new Date(0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'size':
          const sizeA = a.metadata?.size || 0;
          const sizeB = b.metadata?.size || 0;
          comparison = sizeA - sizeB;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, searchQuery, activeFilters, sortBy, sortOrder]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  };
};

// Componente de item individual
interface VirtualListItemProps {
  item: VirtualizedItem & { virtualIndex?: number; offsetTop?: number };
  onExpand?: (itemId: string, expanded: boolean) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const VirtualListItem: React.FC<VirtualListItemProps> = ({ 
  item, 
  onExpand, 
  onClick,
  style 
}) => {
  const Icon = item.type === 'folder' ? Folder : FileText;
  const hasChildren = item.children && item.children.length > 0;

  const handleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onExpand?.(item.id, !item.isExpanded);
    }
  }, [hasChildren, item.id, item.isExpanded, onExpand]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      layout
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors",
        item.type === 'separator' && "border-b-2 border-gray-300 bg-gray-50",
        item.type === 'header' && "bg-gray-100 font-semibold"
      )}
      onClick={onClick}
    >
      {/* Indentation for hierarchy */}
      <div style={{ width: item.level * 20 }} />

      {/* Expand/collapse button */}
      {hasChildren && (
        <button
          onClick={handleExpand}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          {item.isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Icon */}
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        item.type === 'folder' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
      )}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">
            {item.title}
          </h3>
          
          {item.metadata && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {item.metadata.size && (
                <span>{formatFileSize(item.metadata.size)}</span>
              )}
              {item.metadata.modifiedAt && (
                <span>{formatDate(item.metadata.modifiedAt)}</span>
              )}
            </div>
          )}
        </div>
        
        {item.subtitle && (
          <p className="text-sm text-gray-600 truncate mt-1">
            {item.subtitle}
          </p>
        )}
        
        {item.metadata?.tags && item.metadata.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {item.metadata.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {tag}
              </span>
            ))}
            {item.metadata.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{item.metadata.tags.length - 3} mais
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

// Componente de controles de lista
interface ListControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: Set<string>;
  onFilterChange: (filters: Set<string>) => void;
  sortBy: string;
  onSortChange: (sort: string | ((prev: string) => string)) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  totalItems: number;
  visibleItems: number;
}

const ListControls: React.FC<ListControlsProps> = ({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  totalItems,
  visibleItems
}) => {
  const filterOptions = [
    { id: 'note', label: 'Notas', count: 0 },
    { id: 'folder', label: 'Pastas', count: 0 },
    { id: 'header', label: 'Cabeçalhos', count: 0 }
  ];

  const sortOptions = [
    { id: 'name', label: 'Nome' },
    { id: 'date', label: 'Data' },
    { id: 'size', label: 'Tamanho' },
    { id: 'type', label: 'Tipo' }
  ];

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar itens..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-1">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  const newFilters = new Set(activeFilters);
                  if (newFilters.has(filter.id)) {
                    newFilters.delete(filter.id);
                  } else {
                    newFilters.add(filter.id);
                  }
                  onFilterChange(newFilters);
                }}
                className={cn(
                  "px-3 py-1 text-sm rounded-full transition-colors",
                  activeFilters.has(filter.id)
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
          >
            <TrendingUp className={cn(
              "h-4 w-4 transition-transform",
              sortOrder === 'desc' && "rotate-180"
            )} />
          </button>
        </div>

        {/* View mode */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "p-1 rounded transition-colors",
              viewMode === 'list' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "p-1 rounded transition-colors",
              viewMode === 'grid' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>
          Mostrando {visibleItems} de {totalItems} itens
        </span>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Virtualizado</span>
          </div>
          
          <div className="flex items-center gap-1">
            <BarChart className="h-3 w-3" />
            <span>Performance otimizada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
  onItemClick,
  onItemExpand,
  renderItem,
  enableSearch = true,
  enableFilters = true,
  enableGrouping = false,
  className
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Prepare items with expanded state
  const processedItems = useMemo(() => {
    const processItems = (items: VirtualizedItem[]): VirtualizedItem[] => {
      return items.map(item => ({
        ...item,
        isExpanded: expandedItems.has(item.id),
        children: item.children ? processItems(item.children) : undefined
      }));
    };
    
    return processItems(items);
  }, [items, expandedItems]);

  // Apply search and filters
  const {
    filteredItems,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useListFiltering(processedItems);

  // Apply virtualization
  const { visibleItems, totalHeight, handleScroll } = useVirtualization(
    filteredItems,
    itemHeight,
    containerHeight,
    overscan
  );

  const handleItemExpand = useCallback((itemId: string, expanded: boolean) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (expanded) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
    
    onItemExpand?.(itemId, expanded);
  }, [onItemExpand]);

  const handleItemClick = useCallback((item: VirtualizedItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  // Performance monitoring
  const [renderTime, setRenderTime] = useState(0);
  
  useEffect(() => {
    const start = performance.now();
    const end = performance.now();
    setRenderTime(end - start);
  }, [visibleItems]);

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Controls */}
      {(enableSearch || enableFilters) && (
        <ListControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalItems={filteredItems.length}
          visibleItems={visibleItems.length}
        />
      )}

      {/* Virtualized content */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-auto"
          onScroll={handleScroll}
          style={{ height: containerHeight }}
        >
          {/* Virtual container */}
          <div style={{ height: totalHeight, position: 'relative' }}>
            {/* Visible items */}
            <AnimatePresence>
              {visibleItems.map((item) => {
                const style: React.CSSProperties = {
                  position: 'absolute',
                  top: item.offsetTop,
                  left: 0,
                  right: 0,
                  height: itemHeight
                };

                if (renderItem) {
                  return (
                    <div key={item.id} style={style}>
                      {renderItem(item, item.virtualIndex || 0)}
                    </div>
                  );
                }

                return (
                  <VirtualListItem
                    key={item.id}
                    item={item}
                    onExpand={handleItemExpand}
                    onClick={() => handleItemClick(item)}
                    style={style}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-2">Nenhum item encontrado</h3>
              <p className="text-sm">
                {searchQuery ? 'Tente ajustar sua busca' : 'Não há itens para exibir'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance footer */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <span>
          Renderizando {visibleItems.length} de {filteredItems.length} itens
        </span>
        
        <div className="flex items-center gap-4">
          <span>Render: {renderTime.toFixed(2)}ms</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Virtualizado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para criar dados de exemplo
export const useVirtualizedData = (count: number = 1000): VirtualizedItem[] => {
  return useMemo(() => {
    const generateItems = (numItems: number): VirtualizedItem[] => {
      const items: VirtualizedItem[] = [];
      
      for (let i = 0; i < numItems; i++) {
        const isFolder = Math.random() > 0.7;
        const hasChildren = isFolder && Math.random() > 0.5;
        
        const item: VirtualizedItem = {
          id: `item_${i}`,
          type: isFolder ? 'folder' : 'note',
          title: isFolder ? `Pasta ${i + 1}` : `Nota ${i + 1}`,
          subtitle: isFolder 
            ? `${Math.floor(Math.random() * 20)} itens` 
            : 'Conteúdo da nota...',
          content: isFolder ? undefined : `Conteúdo da nota ${i + 1}...`,
          level: 0,
          metadata: {
            size: Math.floor(Math.random() * 1000000),
            modifiedAt: new Date(Date.now() - Math.random() * 10000000000),
            createdAt: new Date(Date.now() - Math.random() * 20000000000),
            author: `Usuário ${Math.floor(Math.random() * 5) + 1}`,
            tags: Array.from({ length: Math.floor(Math.random() * 4) }, (_, i) => 
              `tag${i + 1}`
            )
          },
          children: hasChildren ? generateItems(Math.floor(Math.random() * 10) + 2) : undefined,
          isExpanded: false
        };
        
        items.push(item);
      }
      
      return items;
    };
    
    return generateItems(count);
  }, [count]);
};

export default VirtualizedList; 