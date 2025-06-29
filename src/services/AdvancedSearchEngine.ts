
export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: string;
  createdAt: Date;
  score?: number;
}

export interface SearchOptions {
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
}

export class AdvancedSearchEngine {
  private documents: SearchDocument[] = [];

  addDocument(document: SearchDocument): void {
    this.documents.push(document);
  }

  removeDocument(id: string): void {
    this.documents = this.documents.filter(doc => doc.id !== id);
  }

  async search(options: SearchOptions): Promise<SearchResult> {
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

    return {
      documents: results,
      total,
      suggestions: this.generateSuggestions(options.query)
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

  clear(): void {
    this.documents = [];
  }
}

export const searchEngine = new AdvancedSearchEngine();
