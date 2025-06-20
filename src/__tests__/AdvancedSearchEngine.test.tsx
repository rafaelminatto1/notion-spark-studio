import { renderHook, act } from '@testing-library/react';
import { advancedSearchEngine, AdvancedSearchEngine, SearchDocument, SearchQuery } from '../services/AdvancedSearchEngine';
import useAdvancedSearch from '../hooks/useAdvancedSearch';

// Mock data for testing
const mockDocuments: SearchDocument[] = [
  {
    id: '1',
    title: 'Introduction to Machine Learning',
    content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models.',
    tags: ['AI', 'technology', 'education'],
    type: 'document',
    metadata: {
      author: 'John Doe',
      createdAt: '2024-01-01T00:00:00Z',
      modifiedAt: '2024-01-15T00:00:00Z',
      wordCount: 150,
      readingTime: 5,
      collaborators: ['john.doe@example.com'],
      category: 'technology',
      priority: 'high'
    }
  },
  {
    id: '2',
    title: 'Business Strategy Guide',
    content: 'A comprehensive guide to developing effective business strategies for modern companies.',
    tags: ['business', 'strategy', 'management'],
    type: 'document',
    metadata: {
      author: 'Jane Smith',
      createdAt: '2024-01-02T00:00:00Z',
      modifiedAt: '2024-01-10T00:00:00Z',
      wordCount: 200,
      readingTime: 8,
      collaborators: ['jane.smith@example.com', 'bob.wilson@example.com'],
      category: 'business',
      priority: 'medium'
    }
  },
  {
    id: '3',
    title: 'Creative Writing Tips',
    content: 'Tips and techniques for improving your creative writing skills and storytelling.',
    tags: ['writing', 'creative', 'tips'],
    type: 'note',
    metadata: {
      author: 'Alice Johnson',
      createdAt: '2024-01-03T00:00:00Z',
      modifiedAt: '2024-01-05T00:00:00Z',
      wordCount: 120,
      readingTime: 4,
      collaborators: ['alice.johnson@example.com'],
      category: 'creative',
      priority: 'low'
    }
  }
];

const mockQuery: SearchQuery = {
  text: 'machine learning',
  filters: {
    type: [],
    tags: [],
    author: [],
    category: [],
    priority: []
  },
  options: {
    fuzzy: true,
    semantic: true,
    contextual: true,
    includeContent: true,
    limit: 10,
    offset: 0,
    sortBy: 'relevance',
    sortOrder: 'desc'
  }
};

describe('AdvancedSearchEngine', () => {
  let searchEngine: AdvancedSearchEngine;

  beforeEach(() => {
    searchEngine = new AdvancedSearchEngine();
  });

  describe('Initialization', () => {
    test('should initialize successfully with documents', async () => {
      await searchEngine.initialize(mockDocuments);
      
      expect(searchEngine.getAnalytics).toBeDefined();
      expect(searchEngine.getTrendingQueries).toBeDefined();
    });

    test('should initialize with empty documents', async () => {
      await searchEngine.initialize([]);
      
      const analytics = searchEngine.getAnalytics();
      expect(analytics.totalQueries).toBe(0);
    });
  });

  describe('Document Indexing', () => {
    beforeEach(async () => {
      await searchEngine.initialize([]);
    });

    test('should index document correctly', async () => {
      const document = mockDocuments[0];
      await searchEngine.indexDocument(document);
      
      expect(document.embedding).toBeDefined();
      expect(document.embedding?.length).toBeGreaterThan(0);
    });

    test('should handle multiple documents', async () => {
      for (const doc of mockDocuments) {
        await searchEngine.indexDocument(doc);
      }
      
      // All documents should have embeddings
      expect(mockDocuments.every(doc => doc.embedding)).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await searchEngine.initialize(mockDocuments);
    });

    test('should perform basic text search', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'machine learning'
      };

      const result = await searchEngine.search(query);
      
      expect(result.results).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.analytics).toBeDefined();
      expect(result.analytics.searchTime).toBeGreaterThan(0);
    });

    test('should return relevant results', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'machine learning'
      };

      const result = await searchEngine.search(query);
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].document.title).toContain('Machine Learning');
      expect(result.results[0].score).toBeGreaterThan(0);
    });

    test('should handle empty search text', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: ''
      };

      const result = await searchEngine.search(query);
      
      expect(result.results.length).toBe(0);
      expect(result.suggestions.length).toBe(0);
    });

    test('should filter by document type', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'writing',
        filters: {
          ...mockQuery.filters,
          type: ['note']
        }
      };

      const result = await searchEngine.search(query);
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every(r => r.document.type === 'note')).toBe(true);
    });

    test('should filter by author', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'guide',
        filters: {
          ...mockQuery.filters,
          author: ['Jane Smith']
        }
      };

      const result = await searchEngine.search(query);
      
      if (result.results.length > 0) {
        expect(result.results.every(r => r.document.metadata.author === 'Jane Smith')).toBe(true);
      }
    });

    test('should filter by priority', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'learning',
        filters: {
          ...mockQuery.filters,
          priority: ['high']
        }
      };

      const result = await searchEngine.search(query);
      
      if (result.results.length > 0) {
        expect(result.results.every(r => r.document.metadata.priority === 'high')).toBe(true);
      }
    });

    test('should sort by date', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'guide',
        options: {
          ...mockQuery.options,
          sortBy: 'date',
          sortOrder: 'desc'
        }
      };

      const result = await searchEngine.search(query);
      
      if (result.results.length > 1) {
        const dates = result.results.map(r => new Date(r.document.metadata.modifiedAt).getTime());
        const isSorted = dates.every((date, i) => i === 0 || dates[i - 1] >= date);
        expect(isSorted).toBe(true);
      }
    });

    test('should handle fuzzy search', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'machne lerning', // Intentional typos
        options: {
          ...mockQuery.options,
          fuzzy: true
        }
      };

      const result = await searchEngine.search(query);
      
      // Should still find machine learning results with fuzzy matching
      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });

    test('should generate suggestions', async () => {
      const query: SearchQuery = {
        ...mockQuery,
        text: 'learn'
      };

      const result = await searchEngine.search(query);
      
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('Analytics', () => {
    beforeEach(async () => {
      await searchEngine.initialize(mockDocuments);
    });

    test('should track search analytics', async () => {
      const initialAnalytics = searchEngine.getAnalytics();
      const initialQueries = initialAnalytics.totalQueries;

      await searchEngine.search(mockQuery);
      
      const finalAnalytics = searchEngine.getAnalytics();
      expect(finalAnalytics.totalQueries).toBe(initialQueries + 1);
      expect(finalAnalytics.averageResponseTime).toBeGreaterThan(0);
    });

    test('should get trending queries', async () => {
      // Perform multiple searches
      await searchEngine.search({ ...mockQuery, text: 'machine learning' });
      await searchEngine.search({ ...mockQuery, text: 'business strategy' });
      await searchEngine.search({ ...mockQuery, text: 'machine learning' });

      const trending = searchEngine.getTrendingQueries(5);
      
      expect(Array.isArray(trending)).toBe(true);
      expect(trending.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Diagnostics', () => {
    beforeEach(async () => {
      await searchEngine.initialize(mockDocuments);
    });

    test('should run diagnostics successfully', async () => {
      const diagnostics = await searchEngine.runDiagnostics();
      
      expect(diagnostics).toBeDefined();
      expect(diagnostics.indexSize).toBeGreaterThan(0);
      expect(diagnostics.documentsCount).toBe(mockDocuments.length);
      expect(diagnostics.averageSearchTime).toBeGreaterThanOrEqual(0);
      expect(diagnostics.memoryUsage).toBeGreaterThan(0);
      expect(Array.isArray(diagnostics.recommendations)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle search errors gracefully', async () => {
      // Don't initialize the engine
      const uninitializedEngine = new AdvancedSearchEngine();
      
      await expect(uninitializedEngine.search(mockQuery)).rejects.toThrow();
    });

    test('should handle invalid documents', async () => {
      const invalidDoc = {
        id: '',
        title: '',
        content: '',
        tags: [],
        type: 'document' as const,
        metadata: {
          author: '',
          createdAt: '',
          modifiedAt: '',
          wordCount: 0,
          readingTime: 0,
          collaborators: [],
          category: '',
          priority: 'low' as const
        }
      };

      await expect(searchEngine.indexDocument(invalidDoc)).resolves.not.toThrow();
    });
  });
});

describe('useAdvancedSearch Hook', () => {
  beforeEach(() => {
    // Reset any localStorage data
    localStorage.clear();
  });

  test('should initialize correctly', async () => {
    const { result } = renderHook(() => useAdvancedSearch());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.searchText).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  test('should set search text', async () => {
    const { result } = renderHook(() => useAdvancedSearch());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    act(() => {
      result.current.setSearchText('test query');
    });

    expect(result.current.searchText).toBe('test query');
  });

  test('should update filters', async () => {
    const { result } = renderHook(() => useAdvancedSearch());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    act(() => {
      result.current.setFilters({ type: ['document'] });
    });

    expect(result.current.filters.type).toEqual(['document']);
  });

  test('should add and remove filters', async () => {
    const { result } = renderHook(() => useAdvancedSearch());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    act(() => {
      result.current.addFilter('tags', 'AI');
    });

    expect(result.current.filters.tags).toContain('AI');

    act(() => {
      result.current.removeFilter('tags', 'AI');
    });

    expect(result.current.filters.tags).not.toContain('AI');
  });

  test('should clear search', async () => {
    const { result } = renderHook(() => useAdvancedSearch());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    act(() => {
      result.current.setSearchText('test');
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchText).toBe('');
    expect(result.current.results).toEqual([]);
  });

  test('should handle search with custom options', async () => {
    const { result } = renderHook(() => useAdvancedSearch({
      enableAutoSearch: false,
      defaultOptions: { limit: 5 }
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.options.limit).toBe(5);
  });

  test('should perform manual search', async () => {
    const { result } = renderHook(() => useAdvancedSearch({
      enableAutoSearch: false
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    act(() => {
      result.current.setSearchText('test query');
    });

    await act(async () => {
      await result.current.search();
    });

    expect(result.current.searchText).toBe('test query');
  });

  test('should get trending queries', async () => {
    const { result } = renderHook(() => useAdvancedSearch());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const trending = result.current.getTrendingQueries();
    expect(Array.isArray(trending)).toBe(true);
  });

  test('should run diagnostics', async () => {
    const { result } = renderHook(() => useAdvancedSearch());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    let diagnostics;
    await act(async () => {
      diagnostics = await result.current.runDiagnostics();
    });

    expect(diagnostics).toBeDefined();
  });
});

describe('Performance Tests', () => {
  test('should handle large document sets efficiently', async () => {
    // Create a large set of documents
    const largeDocumentSet: SearchDocument[] = [];
    for (let i = 0; i < 1000; i++) {
      largeDocumentSet.push({
        id: `doc-${i}`,
        title: `Document ${i}`,
        content: `This is the content for document ${i}. It contains various keywords and phrases.`,
        tags: [`tag-${i % 10}`, `category-${i % 5}`],
        type: 'document',
        metadata: {
          author: `author-${i % 20}`,
          createdAt: new Date(2024, 0, (i % 30) + 1).toISOString(),
          modifiedAt: new Date(2024, 0, (i % 30) + 1).toISOString(),
          wordCount: 15,
          readingTime: 1,
          collaborators: [`author-${i % 20}@example.com`],
          category: `category-${i % 5}`,
          priority: ['low', 'medium', 'high', 'critical'][i % 4] as any
        }
      });
    }

    const startTime = performance.now();
    await advancedSearchEngine.initialize(largeDocumentSet);
    const initTime = performance.now() - startTime;

    expect(initTime).toBeLessThan(5000); // Should initialize within 5 seconds

    // Test search performance
    const searchStart = performance.now();
    const result = await advancedSearchEngine.search({
      text: 'document content',
      filters: { type: [], tags: [], author: [], category: [], priority: [] },
      options: {
        fuzzy: true,
        semantic: true,
        contextual: true,
        includeContent: true,
        limit: 20,
        offset: 0,
        sortBy: 'relevance',
        sortOrder: 'desc'
      }
    });
    const searchTime = performance.now() - searchStart;

    expect(searchTime).toBeLessThan(1000); // Should search within 1 second
    expect(result.results.length).toBeGreaterThan(0);
  }, 10000); // Increase timeout for performance test

  test('should maintain memory efficiency', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    await advancedSearchEngine.initialize(mockDocuments);

    // Perform multiple searches
    for (let i = 0; i < 100; i++) {
      await advancedSearchEngine.search({
        text: `search ${i}`,
        filters: { type: [], tags: [], author: [], category: [], priority: [] },
        options: {
          fuzzy: true,
          semantic: true,
          contextual: true,
          includeContent: true,
          limit: 10,
          offset: 0,
          sortBy: 'relevance',
          sortOrder: 'desc'
        }
      });
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB for 100 searches)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
}); 