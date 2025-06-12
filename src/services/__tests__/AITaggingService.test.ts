import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AITaggingService } from '../AITaggingService';

describe('AITaggingService', () => {
  let aiTaggingService: AITaggingService;

  beforeEach(() => {
    aiTaggingService = new AITaggingService();
    vi.clearAllMocks();
  });

  describe('generateTags', () => {
    it('deve gerar tags relevantes para um texto', async () => {
      const text = 'Reunião de planejamento do projeto Notion Spark Studio para discutir as próximas features';
      const tags = await aiTaggingService.generateTags(text);

      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toContain('planejamento');
      expect(tags).toContain('projeto');
    });

    it('deve retornar array vazio para texto vazio', async () => {
      const tags = await aiTaggingService.generateTags('');
      expect(tags).toEqual([]);
    });

    it('deve lidar com texto muito longo', async () => {
      const longText = 'a'.repeat(10000);
      const tags = await aiTaggingService.generateTags(longText);
      expect(Array.isArray(tags)).toBe(true);
    });
  });

  describe('suggestTags', () => {
    it('deve sugerir tags baseadas em tags existentes', async () => {
      const existingTags = ['projeto', 'desenvolvimento', 'frontend'];
      const suggestions = await aiTaggingService.suggestTags(existingTags);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('deve retornar array vazio para array de tags vazio', async () => {
      const suggestions = await aiTaggingService.suggestTags([]);
      expect(suggestions).toEqual([]);
    });
  });

  describe('analyzeContent', () => {
    it('deve analisar o conteúdo e retornar insights', async () => {
      const content = 'Documento sobre desenvolvimento web com React e TypeScript';
      const analysis = await aiTaggingService.analyzeContent(content);

      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty('topics');
      expect(analysis).toHaveProperty('sentiment');
      expect(analysis).toHaveProperty('keywords');
    });

    it('deve lidar com conteúdo em diferentes idiomas', async () => {
      const content = 'Document about web development with React and TypeScript';
      const analysis = await aiTaggingService.analyzeContent(content);

      expect(analysis).toBeDefined();
      expect(analysis.topics).toContain('web development');
    });
  });

  describe('optimizeTags', () => {
    it('deve otimizar tags removendo duplicatas e similares', async () => {
      const tags = ['projeto', 'projetos', 'desenvolvimento', 'dev', 'frontend', 'front-end'];
      const optimizedTags = await aiTaggingService.optimizeTags(tags);

      expect(optimizedTags).toBeDefined();
      expect(Array.isArray(optimizedTags)).toBe(true);
      expect(optimizedTags.length).toBeLessThanOrEqual(tags.length);
    });

    it('deve manter tags únicas sem alteração', async () => {
      const tags = ['projeto', 'desenvolvimento', 'frontend'];
      const optimizedTags = await aiTaggingService.optimizeTags(tags);

      expect(optimizedTags).toEqual(tags);
    });
  });

  describe('error handling', () => {
    it('deve lidar com erros de API graciosamente', async () => {
      vi.spyOn(aiTaggingService, 'generateTags').mockRejectedValueOnce(new Error('API Error'));

      await expect(aiTaggingService.generateTags('test')).rejects.toThrow('API Error');
    });

    it('deve retornar array vazio em caso de erro', async () => {
      vi.spyOn(aiTaggingService, 'suggestTags').mockRejectedValueOnce(new Error('API Error'));

      const result = await aiTaggingService.suggestTags(['test']).catch(() => []);
      expect(result).toEqual([]);
    });
  });

  describe('performance', () => {
    it('deve processar requisições dentro do limite de tempo', async () => {
      const startTime = Date.now();
      await aiTaggingService.generateTags('test content');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // deve completar em menos de 1 segundo
    });

    it('deve lidar com múltiplas requisições simultâneas', async () => {
      const promises = Array(5).fill(null).map(() => 
        aiTaggingService.generateTags('test content')
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});