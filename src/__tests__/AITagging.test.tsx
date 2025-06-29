
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AITaggingService } from '../services/AITaggingService';

// Mock básico para o teste
global.fetch = vi.fn();

describe('AITaggingService', () => {
  let service: AITaggingService;

  beforeEach(() => {
    service = new AITaggingService();
    vi.clearAllMocks();
  });

  it('deve ser instanciado corretamente', () => {
    expect(service).toBeInstanceOf(AITaggingService);
  });

  it('deve ter método suggestTags', () => {
    expect(typeof service.suggestTags).toBe('function');
  });

  it('deve processar conteúdo vazio', async () => {
    const result = await service.suggestTags('');
    expect(Array.isArray(result)).toBe(true);
  });
});
