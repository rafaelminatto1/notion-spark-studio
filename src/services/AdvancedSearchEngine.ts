
export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: string;
  createdAt: Date;
  score?: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  filters?: {
    type?: string;
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  fuzzy?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  suggestions?: string[];
  results?: SearchDocument[];
  analytics?: {
    queryTime: number;
    totalResults: number;
    suggestions: string[];
  };
}

export interface SearchAnalytics {
  totalQueries: number;
  averageQueryTime: number;
  topQueries: Array<{ query: string; count: number }>;
  popularFilters: Record<string, number>;
}

export class AdvancedSearchEngine {
  private documents: SearchDocument[] = [];
  private analytics: SearchAnalytics = {
    totalQueries: 0,
    averageQueryTime: 0,
    topQueries: [],
    popularFilters: {}
  };

  async initialize(): Promise<void> {
    // Initialize search engine
    console.log('AdvancedSearchEngine initialized');
  }

  addDocument(document: SearchDocument): void {
    this.documents.push(document);
  }

  removeDocument(id: string): void {
    this.documents = this.documents.filter(doc => doc.id !== id);
  }

  async indexDocument(document: SearchDocument): Promise<SearchDocument | undefined> {
    // Generate embedding for the document
    const embedding = this.generateEmbedding(document.content);
    const indexedDocument = { ...document, embedding };
    this.addDocument(indexedDocument);
    return indexedDocument;
  }

  private generateEmbedding(content: string): number[] {
    // Simple mock embedding generation
    return content.split('').map((_, i) => Math.random() * (i + 1));
  }

  async search(options: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    let results = [...this.documents];
    
    // Apply text search
    if (options.query) {
      results = results.filter(doc => 
        doc.title.toLowerCase().includes(options.query.toLowerCase()) ||
        doc.content.toLowerCase().includes(options.query.toLowerCase())
      );
    }

    // Apply filters
    if (options.filters?.type) {
      results = results.filter(doc => doc.type === options.filters?.type);
    }

    if (options.filters?.tags && options.filters.tags.length > 0) {
      results = results.filter(doc => 
        options.filters?.tags?.some(tag => doc.tags.includes(tag))
      );
    }

    // Calculate scores
    results = results.map(doc => ({
      ...doc,
      score: this.calculateScore(doc, options.query)
    }));

    // Sort by score
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Apply pagination
    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    results = results.slice(offset, offset + limit);

    const queryTime = Date.now() - startTime;
    
    // Update analytics
    this.analytics.totalQueries++;
    this.analytics.averageQueryTime = 
      (this.analytics.averageQueryTime + queryTime) / this.analytics.totalQueries;

    return {
      documents: results,
      total,
      suggestions: this.generateSuggestions(options.query),
      results: results,
      analytics: {
        queryTime,
        totalResults: total,
        suggestions: this.generateSuggestions(options.query)
      }
    };
  }

  private calculateScore(document: SearchDocument, query: string): number {
    if (!query) return 1;
    
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // Title match has higher weight
    if (document.title.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // Content match
    if (document.content.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }
    
    // Tag match
    if (document.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      score += 3;
    }
    
    return score;
  }

  private generateSuggestions(query: string): string[] {
    if (!query) return [];
    
    // Simple suggestion generation
    const suggestions = [
      `${query} tutorial`,
      `${query} examples`,
      `${query} guide`
    ];
    
    return suggestions;
  }

  getDocumentById(id: string): SearchDocument | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  getTotalDocuments(): number {
    return this.documents.length;
  }

  getAnalytics(): SearchAnalytics {
    return { ...this.analytics };
  }

  getTrendingQueries(): Array<{ query: string; count: number }> {
    return this.analytics.topQueries.slice(0, 10);
  }

  clear(): void {
    this.documents = [];
    this.analytics = {
      totalQueries: 0,
      averageQueryTime: 0,
      topQueries: [],
      popularFilters: {}
    };
  }
}

export const advancedSearchEngine = new AdvancedSearchEngine();
export const searchEngine = new AdvancedSearchEngine();
