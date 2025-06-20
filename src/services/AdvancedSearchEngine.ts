import { debounce } from 'lodash';

// Types for search functionality
export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: 'document' | 'note' | 'template' | 'database' | 'page';
  metadata: {
    author: string;
    createdAt: string;
    modifiedAt: string;
    wordCount: number;
    readingTime: number;
    collaborators: string[];
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  embedding?: number[];
  score?: number;
}

export interface SearchQuery {
  text: string;
  filters: {
    type?: string[];
    tags?: string[];
    author?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    category?: string[];
    priority?: string[];
  };
  options: {
    fuzzy: boolean;
    semantic: boolean;
    contextual: boolean;
    includeContent: boolean;
    limit: number;
    offset: number;
    sortBy: 'relevance' | 'date' | 'title' | 'popularity';
    sortOrder: 'asc' | 'desc';
  };
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights: {
    title: string[];
    content: string[];
    tags: string[];
  };
  explanation: string;
  context: {
    matchType: 'exact' | 'fuzzy' | 'semantic' | 'contextual';
    matchedTerms: string[];
    relevanceFactors: string[];
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'completion' | 'correction' | 'related' | 'trending';
  score: number;
  metadata?: {
    frequency: number;
    recentSearches: boolean;
    popularityScore: number;
  };
}

export interface SearchAnalytics {
  totalQueries: number;
  averageResponseTime: number;
  popularQueries: string[];
  failedQueries: string[];
  userSatisfaction: number;
  clickThroughRate: number;
  searchPatterns: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

// Advanced Search Engine with AI capabilities
export class AdvancedSearchEngine {
  private documents: Map<string, SearchDocument> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private semanticIndex: Map<string, number[]> = new Map();
  private queryHistory: string[] = [];
  private searchAnalytics: SearchAnalytics;
  private stopWords: Set<string>;
  private stemmer: (word: string) => string;
  private initialized = false;

  constructor() {
    this.searchAnalytics = {
      totalQueries: 0,
      averageResponseTime: 0,
      popularQueries: [],
      failedQueries: [],
      userSatisfaction: 0.85,
      clickThroughRate: 0.72,
      searchPatterns: {
        hourly: new Array(24).fill(0),
        daily: new Array(7).fill(0),
        weekly: new Array(52).fill(0),
      },
    };

    // Common stop words (Portuguese and English)
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'o', 'a', 'os', 'as', 'um', 'uma',
      'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
      'por', 'para', 'com', 'sem', 'sobre', 'entre', 'durante'
    ]);

    // Simple stemmer (can be enhanced with proper stemming algorithms)
    this.stemmer = (word: string) => {
      word = word.toLowerCase();
      
      // Portuguese suffixes
      const ptSuffixes = ['ção', 'são', 'mente', 'ando', 'endo', 'indo', 'ado', 'edo', 'ido'];
      for (const suffix of ptSuffixes) {
        if (word.endsWith(suffix)) {
          return word.slice(0, -suffix.length);
        }
      }
      
      // English suffixes
      const enSuffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion'];
      for (const suffix of enSuffixes) {
        if (word.endsWith(suffix)) {
          return word.slice(0, -suffix.length);
        }
      }
      
      return word;
    };
  }

  async initialize(documents: SearchDocument[] = []): Promise<void> {
    console.log('[AdvancedSearch] Initializing search engine...');
    
    const startTime = performance.now();

    try {
      // Clear existing data
      this.documents.clear();
      this.invertedIndex.clear();
      this.semanticIndex.clear();

      // Index all documents
      for (const doc of documents) {
        await this.indexDocument(doc);
      }

      // Load search history and analytics
      await this.loadSearchHistory();
      await this.loadAnalytics();

      this.initialized = true;
      
      const endTime = performance.now();
      console.log(`[AdvancedSearch] Engine initialized with ${documents.length} documents in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('[AdvancedSearch] Initialization failed:', error);
      throw error;
    }
  }

  async indexDocument(document: SearchDocument): Promise<void> {
    // Store document
    this.documents.set(document.id, document);

    // Tokenize and index text content
    const text = `${document.title} ${document.content} ${document.tags.join(' ')}`;
    const tokens = this.tokenize(text);

    // Build inverted index
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(document.id);
    }

    // Generate semantic embedding
    const embedding = await this.generateEmbedding(text);
    this.semanticIndex.set(document.id, embedding);
    document.embedding = embedding;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.stopWords.has(token))
      .map(token => this.stemmer(token));
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simplified TF-IDF based embedding
    const tokens = this.tokenize(text);
    const tokenCounts = new Map<string, number>();
    
    // Count token frequencies
    for (const token of tokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    }

    // Create embedding vector
    const embedding = new Array(100).fill(0);
    let index = 0;
    
    for (const [token, count] of Array.from(tokenCounts.entries()).slice(0, 100)) {
      const tf = count / tokens.length;
      const docFreq = this.invertedIndex.get(token)?.size || 1;
      const idf = Math.log(this.documents.size / docFreq);
      embedding[index] = tf * idf;
      index++;
    }

    return embedding;
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  // Search method will be implemented in next part
  searchDebounced = debounce(this.search.bind(this), 300);

  async search(query: SearchQuery): Promise<{
    results: SearchResult[];
    suggestions: SearchSuggestion[];
    analytics: { totalFound: number; searchTime: number; queryId: string; };
  }> {
    if (!this.initialized) {
      throw new Error('Search engine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    const queryId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Update analytics
      this.searchAnalytics.totalQueries++;
      this.queryHistory.push(query.text);

      // Handle empty search
      if (!query.text.trim()) {
        return {
          results: [],
          suggestions: this.generateSuggestions(''),
          analytics: { totalFound: 0, searchTime: 0, queryId }
        };
      }

      // Search for matching documents
      const candidates = new Set<string>();
      const tokens = this.tokenize(query.text);

      // Text-based search - if no tokens, include all documents for filtering
      if (tokens.length === 0) {
        this.documents.forEach((_, id) => candidates.add(id));
      } else {
        for (const token of tokens) {
          const docIds = this.invertedIndex.get(token);
          if (docIds) {
            docIds.forEach(id => candidates.add(id));
          }
        }
      }

      // Also search in titles and content directly for broader matching
      const searchText = query.text.toLowerCase();
      this.documents.forEach((doc, id) => {
        if (
          doc.title.toLowerCase().includes(searchText) ||
          doc.content.toLowerCase().includes(searchText) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchText))
        ) {
          candidates.add(id);
        }
      });

      // Filter documents based on query filters
      const filteredCandidates = Array.from(candidates).filter(docId => {
        const doc = this.documents.get(docId);
        if (!doc) return false;

        // Type filter
        if (query.filters.type && query.filters.type.length > 0) {
          if (!query.filters.type.includes(doc.type)) return false;
        }

        // Author filter
        if (query.filters.author && query.filters.author.length > 0) {
          if (!query.filters.author.includes(doc.metadata.author)) return false;
        }

        // Category filter
        if (query.filters.category && query.filters.category.length > 0) {
          if (!query.filters.category.includes(doc.metadata.category)) return false;
        }

        // Priority filter
        if (query.filters.priority && query.filters.priority.length > 0) {
          if (!query.filters.priority.includes(doc.metadata.priority)) return false;
        }

        // Tags filter
        if (query.filters.tags && query.filters.tags.length > 0) {
          const hasMatchingTag = query.filters.tags.some(tag => 
            doc.tags.some(docTag => docTag.toLowerCase().includes(tag.toLowerCase()))
          );
          if (!hasMatchingTag) return false;
        }

        return true;
      });

      // Score and rank results
      const results: SearchResult[] = filteredCandidates
        .map(docId => {
          const doc = this.documents.get(docId)!;
          const score = this.calculateRelevanceScore(doc, query);
          
          return {
            document: doc,
            score,
            highlights: this.generateHighlights(doc, query.text),
            explanation: this.generateExplanation(doc, query, score),
            context: {
              matchType: this.determineMatchType(doc, query),
              matchedTerms: tokens.filter(token => 
                doc.title.toLowerCase().includes(token) || 
                doc.content.toLowerCase().includes(token)
              ),
              relevanceFactors: this.getRelevanceFactors(doc, query)
            }
          };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => {
          if (query.options.sortBy === 'relevance') {
            return query.options.sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
          } else if (query.options.sortBy === 'date') {
            const dateA = new Date(a.document.metadata.modifiedAt).getTime();
            const dateB = new Date(b.document.metadata.modifiedAt).getTime();
            return query.options.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          } else if (query.options.sortBy === 'title') {
            return query.options.sortOrder === 'desc' 
              ? b.document.title.localeCompare(a.document.title)
              : a.document.title.localeCompare(b.document.title);
          }
          return 0;
        })
        .slice(query.options.offset, query.options.offset + query.options.limit);

      // Generate suggestions
      const suggestions = this.generateSuggestions(query.text);

      // Update search analytics
      const searchTime = performance.now() - startTime;
      if (this.searchAnalytics.totalQueries === 1) {
        this.searchAnalytics.averageResponseTime = searchTime;
      } else {
        this.searchAnalytics.averageResponseTime = 
          (this.searchAnalytics.averageResponseTime * (this.searchAnalytics.totalQueries - 1) + searchTime) / this.searchAnalytics.totalQueries;
      }

      // Save analytics
      this.saveAnalytics();

      return {
        results,
        suggestions,
        analytics: { 
          totalFound: filteredCandidates.length,
          searchTime,
          queryId
        }
      };

    } catch (error) {
      console.error('[AdvancedSearch] Search failed:', error);
      this.searchAnalytics.failedQueries.push(query.text);
      throw error;
    }
  }

  private calculateRelevanceScore(document: SearchDocument, query: SearchQuery): number {
    let score = 0;
    const tokens = this.tokenize(query.text);
    const searchText = query.text.toLowerCase();

    // Direct text matching (highest priority)
    if (document.title.toLowerCase().includes(searchText)) {
      score += 10;
    }
    if (document.content.toLowerCase().includes(searchText)) {
      score += 5;
    }

    // Tag matching
    if (document.tags.some(tag => tag.toLowerCase().includes(searchText))) {
      score += 8;
    }

    // Token-based matching
    const titleTokens = this.tokenize(document.title);
    const contentTokens = this.tokenize(document.content);
    const tagTokens = document.tags.flatMap(tag => this.tokenize(tag));

    const titleMatches = tokens.filter(token => titleTokens.includes(token)).length;
    const contentMatches = tokens.filter(token => contentTokens.includes(token)).length;
    const tagMatches = tokens.filter(token => tagTokens.includes(token)).length;

    score += titleMatches * 3;
    score += contentMatches * 1;
    score += tagMatches * 2;

    // Boost high priority documents
    if (document.metadata.priority === 'high') {
      score += 2;
    } else if (document.metadata.priority === 'critical') {
      score += 4;
    }

    // Semantic similarity (if enabled)
    if (query.options.semantic && document.embedding) {
      const queryEmbedding = this.generateSimpleEmbedding(query.text);
      const semanticScore = this.calculateCosineSimilarity(document.embedding, queryEmbedding);
      score += semanticScore * 5;
    }

    return Math.max(score, 0.1); // Ensure minimum score for any match
  }

  private generateSimpleEmbedding(text: string): number[] {
    const tokens = this.tokenize(text);
    const embedding = new Array(100).fill(0);
    
    tokens.forEach((token, index) => {
      if (index < 100) {
        // Use a simple hash-based approach for consistency
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
          hash = ((hash << 5) - hash + token.charCodeAt(i)) & 0xffffffff;
        }
        embedding[index] = Math.abs(hash) / 0xffffffff;
      }
    });
    
    return embedding;
  }

  private generateHighlights(document: SearchDocument, searchText: string): {
    title: string[];
    content: string[];
    tags: string[];
  } {
    const tokens = this.tokenize(searchText);
    const lowerSearchText = searchText.toLowerCase();
    
    return {
      title: tokens.filter(token => document.title.toLowerCase().includes(token))
        .concat(document.title.toLowerCase().includes(lowerSearchText) ? [searchText] : []),
      content: tokens.filter(token => document.content.toLowerCase().includes(token))
        .concat(document.content.toLowerCase().includes(lowerSearchText) ? [searchText] : []),
      tags: tokens.filter(token => 
        document.tags.some(tag => tag.toLowerCase().includes(token))
      ).concat(
        document.tags.some(tag => tag.toLowerCase().includes(lowerSearchText)) ? [searchText] : []
      )
    };
  }

  private generateExplanation(document: SearchDocument, query: SearchQuery, score: number): string {
    const reasons = [];
    const lowerSearchText = query.text.toLowerCase();
    
    if (document.title.toLowerCase().includes(lowerSearchText)) {
      reasons.push('title match');
    }
    if (document.content.toLowerCase().includes(lowerSearchText)) {
      reasons.push('content match');
    }
    if (document.tags.some(tag => tag.toLowerCase().includes(lowerSearchText))) {
      reasons.push('tag match');
    }
    if (document.metadata.priority === 'high' || document.metadata.priority === 'critical') {
      reasons.push('high priority');
    }
    
    return `Relevance score ${score.toFixed(2)}${reasons.length > 0 ? ' based on ' + reasons.join(', ') : ''}`;
  }

  private determineMatchType(document: SearchDocument, query: SearchQuery): 'exact' | 'fuzzy' | 'semantic' | 'contextual' {
    const text = query.text.toLowerCase();
    
    if (document.title.toLowerCase().includes(text) || document.content.toLowerCase().includes(text)) {
      return 'exact';
    }
    
    if (query.options.semantic) {
      return 'semantic';
    }
    
    if (query.options.fuzzy) {
      return 'fuzzy';
    }
    
    return 'contextual';
  }

  private getRelevanceFactors(document: SearchDocument, query: SearchQuery): string[] {
    const factors = [];
    const lowerSearchText = query.text.toLowerCase();
    
    if (document.title.toLowerCase().includes(lowerSearchText)) {
      factors.push('Title contains search terms');
    }
    if (document.content.toLowerCase().includes(lowerSearchText)) {
      factors.push('Content contains search terms');
    }
    if (document.tags.some(tag => tag.toLowerCase().includes(lowerSearchText))) {
      factors.push('Tags match search terms');
    }
    if (document.metadata.priority === 'high') {
      factors.push('High priority document');
    }
    if (document.metadata.priority === 'critical') {
      factors.push('Critical priority document');
    }
    
    return factors;
  }

  private generateSuggestions(searchText: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    // Add trending queries as suggestions
    const trending = this.getTrendingQueries(5);
    trending.forEach(({ query, count }) => {
      if (query !== searchText && (searchText === '' || query.toLowerCase().includes(searchText.toLowerCase()))) {
        suggestions.push({
          text: query,
          type: 'trending',
          score: count / Math.max(this.queryHistory.length, 1),
          metadata: {
            frequency: count,
            recentSearches: true,
            popularityScore: count / Math.max(this.queryHistory.length, 1)
          }
        });
      }
    });
    
    // Add completion suggestions
    if (searchText.length >= 2) {
      const completions = ['machine learning', 'business strategy', 'creative writing', 'artificial intelligence', 'data analysis', 'web development'];
      completions.forEach(completion => {
        if (completion.toLowerCase().includes(searchText.toLowerCase()) && completion !== searchText) {
          suggestions.push({
            text: completion,
            type: 'completion',
            score: 0.8,
            metadata: {
              frequency: 1,
              recentSearches: false,
              popularityScore: 0.8
            }
          });
        }
      });
    }
    
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private saveAnalytics(): void {
    try {
      localStorage.setItem('advancedSearchAnalytics', JSON.stringify(this.searchAnalytics));
      localStorage.setItem('advancedSearchHistory', JSON.stringify(this.queryHistory.slice(-100))); // Keep last 100
    } catch (error) {
      console.warn('[AdvancedSearch] Failed to save analytics:', error);
    }
  }

  private async loadSearchHistory(): Promise<void> {
    try {
      const stored = localStorage.getItem('advancedSearchHistory');
      if (stored) {
        this.queryHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[AdvancedSearch] Failed to load search history:', error);
    }
  }

  private async loadAnalytics(): Promise<void> {
    try {
      const stored = localStorage.getItem('advancedSearchAnalytics');
      if (stored) {
        const loadedAnalytics = JSON.parse(stored);
        this.searchAnalytics = { ...this.searchAnalytics, ...loadedAnalytics };
      }
    } catch (error) {
      console.warn('[AdvancedSearch] Failed to load analytics:', error);
    }
  }

  // Missing methods for analytics and diagnostics
  public getAnalytics(): SearchAnalytics {
    return { ...this.searchAnalytics };
  }

  public getTrendingQueries(limit: number = 10): { query: string; count: number }[] {
    const queryMap = new Map<string, number>();
    
    // Count occurrences in search history
    this.queryHistory.forEach(query => {
      queryMap.set(query, (queryMap.get(query) || 0) + 1);
    });

    // Convert to array and sort by count
    return Array.from(queryMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public async runDiagnostics(): Promise<{
    indexSize: number;
    documentsCount: number;
    averageSearchTime: number;
    memoryUsage: number;
    recommendations: string[];
  }> {
    const indexSize = this.invertedIndex.size;
    const documentsCount = this.documents.size;
    const averageSearchTime = this.searchAnalytics.averageResponseTime;
    
    // Estimate memory usage
    let memoryUsage = 0;
    try {
      memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    } catch {
      memoryUsage = indexSize * 100; // Estimate based on index size
    }

    const recommendations: string[] = [];
    
    if (indexSize > 10000) {
      recommendations.push('Consider optimizing index for large document sets');
    }
    if (averageSearchTime > 500) {
      recommendations.push('Search performance could be improved');
    }
    if (documentsCount < 10) {
      recommendations.push('Add more documents to improve search quality');
    }

    return {
      indexSize,
      documentsCount,
      averageSearchTime,
      memoryUsage,
      recommendations
    };
  }
}

// Singleton instance
export const advancedSearchEngine = new AdvancedSearchEngine(); 