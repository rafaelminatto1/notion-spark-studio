
import { useState, useMemo } from 'react';
import { FileItem } from '@/types';

export interface SearchResult {
  file: FileItem;
  matches: Array<{
    type: 'title' | 'content' | 'tag';
    text: string;
    context?: string;
  }>;
  score: number;
}

export const useGlobalSearch = (files: FileItem[]) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    tags: [] as string[],
    dateRange: null as { start: Date; end: Date } | null,
    type: 'all' as 'all' | 'file' | 'folder'
  });

  const searchResults = useMemo(() => {
    if (!query.trim() && filters.tags.length === 0) return [];

    const results: SearchResult[] = [];

    files.filter(f => f.type === 'file').forEach(file => {
      const matches: SearchResult['matches'] = [];
      let score = 0;

      // Search in title
      if (file.name.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          type: 'title',
          text: file.name
        });
        score += 10;
      }

      // Search in content
      if (file.content && file.content.toLowerCase().includes(query.toLowerCase())) {
        const index = file.content.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, index - 30);
        const end = Math.min(file.content.length, index + query.length + 30);
        const context = file.content.slice(start, end);
        
        matches.push({
          type: 'content',
          text: query,
          context: context
        });
        score += 5;
      }

      // Search in tags
      file.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            type: 'tag',
            text: tag
          });
          score += 3;
        }
      });

      // Apply tag filters
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag => 
          file.tags?.includes(filterTag)
        );
        if (!hasMatchingTag) return;
      }

      // Apply date filter
      if (filters.dateRange) {
        const fileDate = file.updatedAt;
        if (fileDate < filters.dateRange.start || fileDate > filters.dateRange.end) {
          return;
        }
      }

      if (matches.length > 0 || filters.tags.length > 0) {
        results.push({ file, matches, score });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }, [files, query, filters]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    searchResults
  };
};
