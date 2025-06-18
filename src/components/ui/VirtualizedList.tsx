import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { FixedSizeList as List } from 'react-window';
import { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VirtualizedListItem {
  id: string;
  title: string;
  content?: string;
  tags?: string[];
  size?: number;
  createdAt?: Date;
  modifiedAt?: Date;
  type?: 'file' | 'folder' | 'note';
  metadata?: Record<string, any>;
}

interface SortConfig {
  key: keyof VirtualizedListItem;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  searchTerm: string;
  tags: string[];
  type?: 'file' | 'folder' | 'note';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface VirtualizedListProps {
  items: VirtualizedListItem[];
  itemHeight?: number | ((index: number) => number);
  onItemClick?: (item: VirtualizedListItem) => void;
  onItemDoubleClick?: (item: VirtualizedListItem) => void;
  renderItem?: (item: VirtualizedListItem, index: number) => React.ReactNode;
  enableSearch?: boolean;
  enableFilter?: boolean;
  enableSort?: boolean;
  enableSelection?: boolean;
  className?: string;
  overscan?: number;
  threshold?: number; // Número mínimo de items para ativar virtualização
}

// Componente padrão de item
const DefaultItemRenderer: React.FC<{
  item: VirtualizedListItem;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}> = ({ item, index, isSelected, onClick, onDoubleClick }) => {
  return (
    <div
      className={`
        flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800
        hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {item.title}
          </h3>
          {item.type && (
            <Badge variant="outline" className="text-xs">
              {item.type}
            </Badge>
          )}
        </div>
        {item.content && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
            {item.content}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
        {item.modifiedAt && (
          <div>{item.modifiedAt.toLocaleDateString()}</div>
        )}
        {item.size && (
          <div>{(item.size / 1024).toFixed(1)} KB</div>
        )}
      </div>
    </div>
  );
};

// Hook para filtrar e ordenar items
const useFilteredAndSortedItems = (
  items: VirtualizedListItem[],
  filterConfig: FilterConfig,
  sortConfig: SortConfig | null
) => {
  return useMemo(() => {
    let filtered = items;

    // Aplicar filtros
    if (filterConfig.searchTerm) {
      const term = filterConfig.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.content?.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (filterConfig.type) {
      filtered = filtered.filter(item => item.type === filterConfig.type);
    }

    if (filterConfig.tags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags?.some(tag => filterConfig.tags.includes(tag))
      );
    }

    if (filterConfig.dateRange) {
      const { start, end } = filterConfig.dateRange;
      filtered = filtered.filter(item => {
        const date = item.modifiedAt || item.createdAt;
        return date && date >= start && date <= end;
      });
    }

    // Aplicar ordenação
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;

        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [items, filterConfig, sortConfig]);
};

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  itemHeight = 80,
  onItemClick,
  onItemDoubleClick,
  renderItem,
  enableSearch = true,
  enableFilter = false,
  enableSort = true,
  enableSelection = false,
  className = '',
  overscan = 5,
  threshold = 100
}) => {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    searchTerm: '',
    tags: []
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'modifiedAt',
    direction: 'desc'
  });
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const listRef = useRef<List | VariableSizeList>(null);

  const filteredAndSortedItems = useFilteredAndSortedItems(items, filterConfig, sortConfig);

  // Determinar se deve usar virtualização
  const shouldVirtualize = filteredAndSortedItems.length > threshold;

  // Handler para ordenação
  const handleSort = useCallback((key: keyof VirtualizedListItem) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Handler para seleção
  const handleItemSelection = useCallback((itemId: string, ctrlKey = false) => {
    if (!enableSelection) return;

    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      
      if (ctrlKey) {
        if (newSelection.has(itemId)) {
          newSelection.delete(itemId);
        } else {
          newSelection.add(itemId);
        }
      } else {
        newSelection.clear();
        newSelection.add(itemId);
      }
      
      return newSelection;
    });
  }, [enableSelection]);

  // Componente de item virtualizado
  const VirtualizedItemRenderer = useCallback(({ index, style }: ListChildComponentProps) => {
    const item = filteredAndSortedItems[index];
    const isSelected = selectedItems.has(item.id);

    const handleClick = (e: React.MouseEvent) => {
      handleItemSelection(item.id, e.ctrlKey || e.metaKey);
      onItemClick?.(item);
    };

    const handleDoubleClick = () => {
      onItemDoubleClick?.(item);
    };

    return (
      <div style={style}>
        {renderItem ? (
          renderItem(item, index)
        ) : (
          <DefaultItemRenderer
            item={item}
            index={index}
            isSelected={isSelected}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          />
        )}
      </div>
    );
  }, [filteredAndSortedItems, selectedItems, renderItem, onItemClick, onItemDoubleClick, handleItemSelection]);

  // Lista não virtualizada para poucos items
  const NonVirtualizedList = () => (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {filteredAndSortedItems.map((item, index) => {
        const isSelected = selectedItems.has(item.id);
        
        const handleClick = (e: React.MouseEvent) => {
          handleItemSelection(item.id, e.ctrlKey || e.metaKey);
          onItemClick?.(item);
        };

        const handleDoubleClick = () => {
          onItemDoubleClick?.(item);
        };

        return (
          <div key={item.id}>
            {renderItem ? (
              renderItem(item, index)
            ) : (
              <DefaultItemRenderer
                item={item}
                index={index}
                isSelected={isSelected}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Effect para scroll para item selecionado
  useEffect(() => {
    if (shouldVirtualize && listRef.current && selectedItems.size === 1) {
      const selectedId = Array.from(selectedItems)[0];
      const index = filteredAndSortedItems.findIndex(item => item.id === selectedId);
      if (index !== -1) {
        listRef.current.scrollToItem(index, 'smart');
      }
    }
  }, [selectedItems, filteredAndSortedItems, shouldVirtualize]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controles de busca e filtro */}
      {(enableSearch || enableSort) && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {enableSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar items..."
                value={filterConfig.searchTerm}
                onChange={(e) => { setFilterConfig(prev => ({ ...prev, searchTerm: e.target.value })); }}
                className="pl-10"
              />
            </div>
          )}

          {enableSort && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { handleSort('title'); }}
                className="flex items-center gap-1"
              >
                Título
                {sortConfig?.key === 'title' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => { handleSort('modifiedAt'); }}
                className="flex items-center gap-1"
              >
                Data
                {sortConfig?.key === 'modifiedAt' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => { handleSort('size'); }}
                className="flex items-center gap-1"
              >
                Tamanho
                {sortConfig?.key === 'size' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lista de resultados */}
      <div className="flex-1 relative">
        {filteredAndSortedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
              <p className="text-sm">
                {filterConfig.searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há items para exibir'
                }
              </p>
            </div>
          </div>
        ) : shouldVirtualize ? (
          <AutoSizer>
            {({ height, width }) => (
              typeof itemHeight === 'function' ? (
                <VariableSizeList
                  ref={listRef as any}
                  height={height}
                  width={width}
                  itemCount={filteredAndSortedItems.length}
                  itemSize={itemHeight}
                  overscanCount={overscan}
                >
                  {VirtualizedItemRenderer}
                </VariableSizeList>
              ) : (
                <List
                  ref={listRef as any}
                  height={height}
                  width={width}
                  itemCount={filteredAndSortedItems.length}
                  itemSize={itemHeight}
                  overscanCount={overscan}
                >
                  {VirtualizedItemRenderer}
                </List>
              )
            )}
          </AutoSizer>
        ) : (
          <div className="overflow-auto h-full">
            <NonVirtualizedList />
          </div>
        )}
      </div>

      {/* Footer com estatísticas */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {filteredAndSortedItems.length} de {items.length} items
            {shouldVirtualize && (
              <Badge variant="outline" className="ml-2 text-xs">
                Virtualizado
              </Badge>
            )}
          </span>
          {enableSelection && selectedItems.size > 0 && (
            <span>
              {selectedItems.size} selecionado{selectedItems.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedList; 