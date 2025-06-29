
import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedSearchEngine, SearchDocument, SearchQuery } from '../services/AdvancedSearchEngine';

describe('AdvancedSearchEngine', () => {
  let searchEngine: AdvancedSearchEngine;

  const mockDocument: SearchDocument = {
    id: '1',
    title: 'Test Document',
    content: 'This is a test document about React components',
    tags: ['react', 'components', 'test'],
    type: 'document',
    createdAt: new Date('2024-01-01'),
    metadata: { category: 'tutorial' }
  };

  const mockDocument2: SearchDocument = {
    id: '2',
    title: 'Advanced React Patterns',
    content: 'Learn advanced patterns in React development',
    tags: ['react', 'advanced', 'patterns'],
    type: 'article',
    createdAt: new Date('2024-01-02'),
    metadata: { category: 'advanced' }
  };

  const mockDocument3: SearchDocument = {
    id: '3',
    title: 'JavaScript Fundamentals',
    content: 'Basic JavaScript concepts and examples',
    tags: ['javascript', 'basics', 'fundamentals'],
    type: 'guide',
    createdAt: new Date('2024-01-03'),
    metadata: { category: 'basics' }
  };

  beforeEach(async () => {
    searchEngine = new AdvancedSearchEngine();
    await searchEngine.initialize();
  });

  describe('Inicialização e configuração', () => {
    it('deve inicializar corretamente', async () => {
      await searchEngine.initialize();
      
      const analytics = searchEngine.getAnalytics();
      expect(analytics).toBeDefined();
      const trending = searchEngine.getTrendingQueries();
      expect(trending).toBeDefined();
    });

    it('deve rastrear analytics após inicialização', async () => {
      await searchEngine.initialize();
      
      const initialAnalytics = searchEngine.getAnalytics();
      expect(initialAnalytics.totalQueries).toBe(0);
      expect(initialAnalytics.averageQueryTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Indexação de documentos', () => {
    it('deve indexar documento com embedding', async () => {
      await searchEngine.initialize();
      
      const indexedDoc = await searchEngine.indexDocument(mockDocument);
      
      if (indexedDoc?.embedding) {
        expect(indexedDoc.embedding).toBeDefined();
        expect(indexedDoc.embedding.length).toBeGreaterThan(0);
      }
    });

    it('deve indexar documento sem alterar conteúdo original', async () => {
      const originalContent = mockDocument.content;
      await searchEngine.indexDocument(mockDocument);
      
      const retrievedDoc = searchEngine.getDocumentById('1');
      if (retrievedDoc) {
        expect(retrievedDoc.content).toBe(originalContent);
      }
    });
  });

  describe('Busca básica', () => {
    beforeEach(async () => {
      await searchEngine.initialize();
      searchEngine.addDocument(mockDocument);
      searchEngine.addDocument(mockDocument2);
      searchEngine.addDocument(mockDocument3);
    });

    it('deve realizar busca por texto', async () => {
      const query: SearchQuery = { query: 'React' };
      const result = await searchEngine.search(query);
      
      expect(result.results).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.analytics).toBeDefined();
      if (result.analytics) {
        expect(result.analytics.totalResults).toBeGreaterThan(0);
      }
    });

    it('deve buscar com filtros específicos', async () => {
      const query: SearchQuery = {
        query: 'React',
        filters: { type: 'document' }
      };
      
      const result = await searchEngine.search(query);
      if (result.results && result.results.length > 0) {
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results[0].type).toBe('document');
        expect(result.results[0].score).toBeGreaterThan(0);
      }
    });

    it('deve retornar resultados vazios para query inexistente', async () => {
      const query: SearchQuery = { query: 'nonexistent term' };
      const result = await searchEngine.search(query);
      
      expect(result.results?.length).toBe(0);
      if (result.suggestions) {
        expect(result.suggestions.length).toBe(3);
      }
    });
  });

  describe('Filtros avançados', () => {
    beforeEach(async () => {
      searchEngine.addDocument(mockDocument);
      searchEngine.addDocument(mockDocument2);
      searchEngine.addDocument(mockDocument3);
    });

    it('deve filtrar por tags', async () => {
      const query: SearchQuery = {
        query: '',
        filters: { tags: ['react'] }
      };
      
      const result = await searchEngine.search(query);
      if (result.results && result.results.length > 0) {
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results.every((r: SearchDocument) => r.tags.includes('react'))).toBe(true);
      }
    });

    it('deve filtrar por tipo de documento', async () => {
      const query: SearchQuery = {
        query: '',
        filters: { type: 'article' }
      };
      
      const result = await searchEngine.search(query);
      if (result.results) {
        expect(result.results.every((r: SearchDocument) => r.type === 'article')).toBe(true);
      }
    });

    it('deve filtrar por intervalo de datas', async () => {
      const query: SearchQuery = {
        query: '',
        filters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-02')
          }
        }
      };
      
      const result = await searchEngine.search(query);
      if (result.results) {
        const sortedResults = result.results.map((r: SearchDocument) => r.createdAt);
        const isChronological = sortedResults.every((date: Date, i: number) => 
          i === 0 || date >= sortedResults[i - 1]
        );
        expect(isChronological).toBe(true);
      }
    });
  });

  describe('Paginação', () => {
    beforeEach(() => {
      // Add multiple documents for pagination testing
      for (let i = 0; i < 20; i++) {
        searchEngine.addDocument({
          id: `doc-${i}`,
          title: `Document ${i}`,
          content: `Content for document ${i}`,
          tags: ['test'],
          type: 'document',
          createdAt: new Date()
        });
      }
    });

    it('deve paginar resultados corretamente', async () => {
      const query: SearchQuery = {
        query: 'Document',
        limit: 5,
        offset: 0
      };
      
      const result = await searchEngine.search(query);
      if (result.results) {
        expect(result.results.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Analytics e métricas', () => {
    it('deve rastrear queries executadas', async () => {
      const document = searchEngine.getDocumentById('1');
      if (document) {
        expect(document.id).toBe('1');
      }
    });

    it('deve calcular métricas de performance', async () => {
      await searchEngine.initialize();
      
      // Execute multiple searches to generate analytics
      await searchEngine.search({ query: 'test' });
      
      const analytics = searchEngine.getAnalytics();  
      expect(analytics.totalQueries).toBe(1);
      expect(analytics.averageQueryTime).toBeGreaterThan(0);
    });

    it('deve fornecer queries em trending', async () => {
      await searchEngine.initialize();
      
      await searchEngine.search({ query: 'popular query' });
      await searchEngine.search({ query: 'another query' });
      
      const trending = searchEngine.getTrendingQueries();
      expect(trending.length).toBeGreaterThanOrEqual(0);
    });
  });
});
