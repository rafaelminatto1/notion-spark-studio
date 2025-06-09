
import { useState, useMemo, useCallback } from 'react';
import { FileItem } from '@/types';

export interface SearchFilters {
  type?: 'all' | 'file' | 'folder';
  dateRange?: 'all' | 'today' | 'week' | 'month';
  tags?: string[];
  hasContent?: boolean;
}

export const useAdvancedSearch = (files: FileItem[]) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    tags: [],
    hasContent: false
  });
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  const searchResults = useMemo(() => {
    if (!query && !isAdvancedMode) return files;

    return files.filter(file => {
      // Text search
      const matchesQuery = !query || 
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        (file.content && file.content.toLowerCase().includes(query.toLowerCase())) ||
        (file.description && file.description.toLowerCase().includes(query.toLowerCase()));

      // Type filter
      const matchesType = filters.type === 'all' || file.type === filters.type;

      // Date filter
      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const fileDate = new Date(file.updatedAt);
        
        switch (filters.dateRange) {
          case 'today':
            matchesDate = fileDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = fileDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = fileDate >= monthAgo;
            break;
        }
      }

      // Tags filter
      const matchesTags = filters.tags?.length === 0 || 
        filters.tags?.every(tag => file.tags?.includes(tag));

      // Content filter
      const matchesContent = !filters.hasContent || 
        (file.content && file.content.trim().length > 0);

      return matchesQuery && matchesType && matchesDate && matchesTags && matchesContent;
    });
  }, [files, query, filters, isAdvancedMode]);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      dateRange: 'all',
      tags: [],
      hasContent: false
    });
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    filters,
    updateFilter,
    clearFilters,
    searchResults,
    isAdvancedMode,
    setIsAdvancedMode
  };
};
