
import { useState, useMemo } from 'react';
import { FileItem } from '@/types';

export interface SearchResult {
  file: FileItem;
  matches: Array<{
    type: 'title' | 'content' | 'tag';
    text: string;
    context?: string;
    startIndex?: number;
    endIndex?: number;
  }>;
  score: number;
}

export interface SearchFilters {
  tags: string[];
  dateRange: { start: Date; end: Date } | null;
  type: 'all' | 'file' | 'folder';
  sortBy: 'relevance' | 'modified' | 'created' | 'name';
  sortOrder: 'asc' | 'desc';
}

export const useGlobalSearch = (files: FileItem[]) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    dateRange: null,
    type: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [isSearching, setIsSearching] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim() && filters.tags.length === 0) return [];

    setIsSearching(true);
    const results: SearchResult[] = [];
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

    files.filter(f => f.type === 'file').forEach(file => {
      const matches: SearchResult['matches'] = [];
      let score = 0;

      // Search in title
      if (query.trim()) {
        const titleLower = file.name.toLowerCase();
        searchTerms.forEach(term => {
          const index = titleLower.indexOf(term);
          if (index !== -1) {
            matches.push({
              type: 'title',
              text: file.name,
              startIndex: index,
              endIndex: index + term.length
            });
            // Higher score for exact matches and matches at the beginning
            score += index === 0 ? 15 : 10;
          }
        });
      }

      // Search in content
      if (file.content && query.trim()) {
        const contentLower = file.content.toLowerCase();
        searchTerms.forEach(term => {
          let index = contentLower.indexOf(term);
          let matchCount = 0;
          
          while (index !== -1 && matchCount < 3) { // Limit to 3 matches per term
            const start = Math.max(0, index - 50);
            const end = Math.min(file.content!.length, index + term.length + 50);
            const context = file.content!.slice(start, end);
            
            matches.push({
              type: 'content',
              text: term,
              context: context,
              startIndex: index - start + (start > 0 ? 3 : 0), // Account for "..."
              endIndex: index - start + term.length + (start > 0 ? 3 : 0)
            });
            
            score += 3;
            matchCount++;
            index = contentLower.indexOf(term, index + 1);
          }
        });
      }

      // Search in tags
      file.tags?.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (query.trim()) {
          searchTerms.forEach(term => {
            if (tagLower.includes(term)) {
              matches.push({
                type: 'tag',
                text: tag
              });
              score += tagLower === term ? 8 : 5; // Exact tag match gets higher score
            }
          });
        }
      });

      // Apply tag filters
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag => 
          file.tags?.some(fileTag => fileTag.startsWith(filterTag))
        );
        if (!hasMatchingTag && query.trim()) return;
        if (!hasMatchingTag && !query.trim()) return;
        
        // Boost score for matching filter tags
        if (hasMatchingTag) score += 2;
      }

      // Apply date filter
      if (filters.dateRange) {
        const fileDate = file.updatedAt;
        if (fileDate < filters.dateRange.start || fileDate > filters.dateRange.end) {
          return;
        }
      }

      // Apply type filter
      if (filters.type !== 'all' && file.type !== filters.type) {
        return;
      }

      // Boost score for recent files
      const daysSinceUpdate = (Date.now() - file.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 2;
      if (daysSinceUpdate < 1) score += 3;

      if (matches.length > 0 || filters.tags.length > 0) {
        results.push({ file, matches, score });
      }
    });

    // Sort results
    const sortedResults = results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'modified':
          const dateCompare = b.file.updatedAt.getTime() - a.file.updatedAt.getTime();
          return filters.sortOrder === 'desc' ? dateCompare : -dateCompare;
        case 'created':
          const createdCompare = b.file.createdAt.getTime() - a.file.createdAt.getTime();
          return filters.sortOrder === 'desc' ? createdCompare : -createdCompare;
        case 'name':
          const nameCompare = a.file.name.localeCompare(b.file.name);
          return filters.sortOrder === 'desc' ? -nameCompare : nameCompare;
        case 'relevance':
        default:
          return b.score - a.score;
      }
    });

    setTimeout(() => setIsSearching(false), 100);
    return sortedResults;
  }, [files, query, filters]);

  const clearFilters = () => {
    setFilters({
      tags: [],
      dateRange: null,
      type: 'all',
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const addTagFilter = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag]
    }));
  };

  const removeTagFilter = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return {
    query,
    setQuery,
    filters,
    setFilters,
    searchResults,
    isSearching,
    clearFilters,
    addTagFilter,
    removeTagFilter
  };
};
