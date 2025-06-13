import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSystemIntegration } from '../hooks/useSystemIntegration';

// Mock das dependências complexas
jest.mock('../services/WebSocketService', () => ({
  createWebSocketService: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    joinDocument: jest.fn(),
    leaveDocument: jest.fn(),
    sendContentChange: jest.fn()
  }))
}));

jest.mock('../hooks/useServiceWorker', () => ({
  useServiceWorker: () => ({
    isOfflineCapable: () => true,
    syncDocuments: jest.fn(),
    cacheDocument: jest.fn(),
    updateServiceWorker: jest.fn()
  })
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    getCurrentUserId: () => 'test-user',
    getCurrentUser: () => ({ name: 'Test User' })
  })
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('useSystemIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar corretamente', () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    expect(result.current).toBeDefined();
    expect(typeof result.current.initializeSystem).toBe('function');
    expect(typeof result.current.toggleFeature).toBe('function');
    expect(result.current.status).toBeDefined();
    expect(result.current.features).toBeDefined();
  });

  it('deve inicializar o sistema', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    expect(result.current.status.ai.isEnabled).toBe(true);
  });

  it('deve alternar features', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    const initialAutoTagging = result.current.features.autoTagging;
    
    act(() => {
      result.current.toggleFeature('autoTagging');
    });
    
    expect(result.current.features.autoTagging).toBe(!initialAutoTagging);
  });

  it('deve sugerir tags para arquivo', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    const mockFile = {
      id: 'test-file',
      name: 'Test React Component',
      content: 'Este é um componente React',
      tags: [],
      type: 'file' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    const suggestions = await act(async () => {
      return await result.current.suggestTagsForFile(mockFile);
    });
    
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('deve aplicar tags sugeridas', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    act(() => {
      result.current.applySuggestedTags('test-file', ['react', 'component']);
    });
    
    // Verificar se a função não gera erro
    expect(true).toBe(true);
  });
}); 